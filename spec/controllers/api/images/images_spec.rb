require "spec_helper"
WebMock.allow_net_connect!

describe Api::ImagesController do
  include Devise::Test::ControllerHelpers
  let(:user) { FactoryBot.create(:user) }

  it "" do
    fake_file = ActionDispatch::Http::UploadedFile.new(filename: "wow.jpg", type: "image/jpg", head: "", tempfile: Tempfile.new)
    name = "wow.jpg"
    Image.self_hosted_image_upload(key: "/abc.jpg", file: fake_file)
    expected = "public/direct_upload/temp/abc.jpg"
    assert File.file?(expected)
    File.delete(expected)
  end

  it "Creates a policy object" do
    sign_in user
    b4 = Api::ImagesController.store_locally
    Api::ImagesController.store_locally = false
    get :storage_auth
    Api::ImagesController.store_locally = b4

    expect(response.status).to eq(200)
    expect(json).to be_kind_of(Hash)
    expect(json[:verb]).to eq("POST")
    expect(json[:url]).to include("googleapis")
    expect(json[:form_data].keys.sort).to include(:signature)
    expect(json[:instructions]).to include("POST the resulting URL as an 'attachment_url'")
  end

  it "Creates a (stub) policy object" do
    sign_in user
    b4 = Api::ImagesController.store_locally
    Api::ImagesController.store_locally = true
    get :storage_auth
    Api::ImagesController.store_locally = b4
    expect(response.status).to eq(200)
    expect(json).to be_kind_of(Hash)
    expect(json[:verb]).to eq("POST")
    expect(json[:url]).to include($API_URL)
    [:policy, :signature, :GoogleAccessId]
      .map { |key| expect(json.dig(:form_data, key)).to eq("N/A") }
    expect(json[:form_data].keys.sort).to include(:signature)
  end

  describe "#index" do
    it "shows only the max images allowed" do
      sign_in user
      device = user.device
      # Using the *real* value (10) was super slow (~30 seconds)
      device.update!(max_images_count: 1)
      FactoryBot.create_list(:image, 2, device: user.device)
      get :index
      expect(response.status).to eq(200)
      expect(json.length).to eq(device.max_images_count)
      expect(json.first.key?(:attachment_url)).to be_truthy
    end
  end

  describe "#show" do
    it "shows image meta data" do
      sign_in user
      image = FactoryBot.create(:image, device: user.device)
      get :show, params: { id: image.id }
      expect(response.status).to eq(200)
      expect(json[:id]).to eq(image.id)
      expect(json[:device_id]).to eq(user.device_id)
      expect(json[:meta]).to be_truthy
      expect(json.key?(:attachment_url)).to be_truthy
    end
  end

  describe "#create" do
    it "creates one image", :slow do
      sign_in user
      before_count = Image.count
      post :create,
           body: { attachment_url: FAKE_ATTACHMENT_URL,
                   meta: { x: 1, z: 3 } }.to_json,
           params: { format: :json }
      expect(response.status).to eq(200)
      expect(Image.count).to be > before_count
      expect(json[:device_id]).to eq(user.device.id)
      expect(json.key?(:attachment_processed_at)).to be_truthy
      expect(json[:attachment_url]).to include("placeholder_farmbot.jpg")
      expect(json.dig :meta, :x).to eq(1)
      expect(json.dig :meta, :y).to eq(nil)
      expect(json.dig :meta, :z).to eq(3)
    end

    describe "#delete" do
      it "deletes an image" do
        sign_in user
        image = FactoryBot.create(:image, device: user.device)
        before_count = Image.count
        run_jobs_now do
          delete :destroy, params: { id: image.id }
        end
        expect(response.status).to eq(200)
        expect(Image.count).to be < before_count
      end
    end
  end
end
