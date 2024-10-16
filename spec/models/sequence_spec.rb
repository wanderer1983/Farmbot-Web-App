require "spec_helper"
describe Sequence do
  let(:regimen) { FactoryBot.create(:regimen) }
  let(:with_params) { FakeSequence.with_parameters.id }
  let(:no_params) { Sequence.parameterized?(FakeSequence.create.id) }
  let(:device) { FactoryBot.create(:device) }
  let(:fake_params) do
    j = JSON.parse(File.read("./spec/lib/celery_script/ast_fixture6.json"))
    j[:device] = device
    j.deep_symbolize_keys
  end

  it "enforces uniqueness of names" do
    PinBinding.destroy_all
    Sequence.destroy_all
    optns = { device: regimen.device,
              name: "Dupe",
              color: "red" }
    Sequence.create!(optns)
    expect { Sequence.create!(optns) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "knows when a sequence is parameterized" do
    expect(Sequence.parameterized?(with_params)).to be(true)
  end

  it "knows when a sequence _isnt_ parameterized" do
    expect(no_params).to be(false)
  end

  it "determines if an array of IDs contains parameterized sequences" do
    expect(Sequence.parameterized?([with_params, no_params])).to eq(true)
    expect(Sequence.parameterized?([no_params])).to eq(false)
  end

  it "allows `numeric` variable declarations" do
    result = Sequences::Create.run(**fake_params)
    expect(result.success?).to be(true)
  end

  it "does not allow `numeric` in move_abs" do
    fake_params[:body] = [{
      kind: "move_absolute",
      args: {
        speed: 100,
        location: { kind: "identifier", args: { label: "var1" } },
        offset: { kind: "coordinate", args: { x: 0, y: 0, z: 0 } },
      },
    }]
    result = Sequences::Create.run(**fake_params)
    expect(result.success?).to be(false)
    error = result.errors["body"].message
    expect(error).to include("but got numeric")
  end
end
