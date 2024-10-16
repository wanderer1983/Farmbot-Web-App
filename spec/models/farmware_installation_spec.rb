require "spec_helper"

describe FarmwareInstallation do
  FAKE_URL = "https://raw.githubusercontent.com/"\
             "FarmBot-Labs/set-servo-angle/main"\
             "/manifest.json"
  let(:device) { FactoryBot.create(:device) }

  class Mystery < StandardError; end

  it "handles unknown errors while parsing farmware manifest" do
    error = Mystery.new("wow!")
    fi = FarmwareInstallation.create(device: device, url: FAKE_URL)
    stub_request(:get, FAKE_URL).to_raise(error)
    expect { fi.infer_package_name_from_url }.to raise_error(error)
    expect(fi.package_error)
      .to eq(FarmwareInstallation::OTHER_PROBLEM % Mystery.to_s)
    expect(fi.package).to eq(nil)
  end

  it "handles unreasonably large package names" do
    fi = FarmwareInstallation.create(device: device, url: FAKE_URL)
    stub_request(:get, FAKE_URL).to_return(body: { package: "*" * 100 }.to_json)
    fi.infer_package_name_from_url
    error =
      FarmwareInstallation::KNOWN_PROBLEMS.fetch(ActiveRecord::ValueTooLong)
    expect(fi.package_error).to eq(error)
    expect(fi.package).to eq(nil)
  end

  it "handles unreasonably large payloads" do
    old_value = FarmwareInstallation::MAX_JSON_SIZE
    fi = FarmwareInstallation.create(device: device, url: FAKE_URL)

    const_reassign(FarmwareInstallation, :MAX_JSON_SIZE, 2)

    stub_request(:get, FAKE_URL).to_return(body: {hello: "world"}.to_json)
    fi.infer_package_name_from_url
    error = FarmwareInstallation::KNOWN_PROBLEMS.fetch(JSON::ParserError)
    expect(fi.package_error).to eq(error)
    expect(fi.package).to eq(nil)
    const_reassign(FarmwareInstallation, :MAX_JSON_SIZE, old_value)
  end

  it "sets the package name" do
    fi = FarmwareInstallation.create(device: device, url: FAKE_URL)
    stub_request(:get, FAKE_URL).to_return(body: {package: "FOO"}.to_json)
    fi.infer_package_name_from_url
    expect(fi.package_error).to eq(nil)
    expect(fi.package).to eq("FOO")
  end

  it "handles non-JSON strings" do
    fi = FarmwareInstallation.create(device: device, url: FAKE_URL)
    stub_request(:get, FAKE_URL).to_return(body:"{lol")
    fi.infer_package_name_from_url
    error = FarmwareInstallation::KNOWN_PROBLEMS.fetch(JSON::ParserError)
    expect(fi.package_error).to eq(error)
    expect(fi.package).to eq(nil)
  end

  it "handles `package` fetch errors" do
    fi = FarmwareInstallation.create!(device: device, url: FAKE_URL)
    stub_request(:get, FAKE_URL).to_raise(SocketError.new("No!"))
    fi.infer_package_name_from_url
    error = FarmwareInstallation::KNOWN_PROBLEMS.fetch(SocketError)
    expect(fi.package_error).to eq(error)
    expect(fi.package).to eq(nil)
  end

  it "Enforces uniqueness of URL" do
    FarmwareInstallation.destroy_all
    first  = FarmwareInstallation.create(device: device, url: FAKE_URL)
    second = FarmwareInstallation.create(device: device, url: FAKE_URL)
    expect(first.valid?).to be true
    expect(second.valid?).to be false
    expect(second.errors[:url]).to include("has already been taken")
  end

  it "disallows empty URLs" do
    x = FarmwareInstallation.create(url: "")
    expect(x.errors[:url]).to include("is an invalid URL")
  end
end
