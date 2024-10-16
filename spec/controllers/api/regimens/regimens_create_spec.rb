require "spec_helper"

describe Api::RegimensController do
  include Devise::Test::ControllerHelpers

  describe "#create" do
    let(:user) { FactoryBot.create(:user) }
    let(:sequence) { FakeSequence.create(device: user.device) }

    it "kicks back missing parameters" do
      sign_in user
      celery = File.read("spec/lib/celery_script/ast_fixture5.json")
      json = JSON.parse(celery, symbolize_names: true)
      s = Sequences::Create.run!(json, device: user.device)
      # No parameters here.

      payload = {
        name: "New regimen 1",
        color: "gray",
        regimen_items: [{ time_offset: 300000, sequence_id: s.fetch(:id) }],
        body: [
          {
            kind: "variable_declaration",
            args: { label: "parent", data_value: { kind: "safe_z", args: {} } },
          },
        ],
      }
      before_count = Regimen.count
      post :create, body: payload.to_json, format: :json
      after_count = Regimen.count

      expect(response.status).to eq(422)
      expect(before_count).to eq(after_count)
      expect(json[:body].length).to eq(1)
    end

    it "creates a regimen that uses variables" do
      sign_in user
      s = FakeSequence.with_parameters
      payload = { device: s.device,
                 name: "specs",
                 color: "red",
                 body: [
        {
          kind: "parameter_application",
          args: {
            label: "parent",
            data_value: { kind: "coordinate", args: { x: 0, y: 0, z: 0 } },
          },
        },
      ],
                 regimen_items: [
        { time_offset: 100, sequence_id: s.id },
      ] }
      post :create, body: payload.to_json, format: :json
      expect(response.status).to eq(200)
      declr = json.fetch(:body).first
      expect(declr).to be
      expect(declr.fetch(:kind)).to eq("parameter_application")
      path = [:args, :data_value, :args]
      expect(declr.dig(*path)).to eq({ x: 0, y: 0, z: 0 })
    end

    it "creates a new regimen" do
      sign_in user
      color = %w(blue green yellow orange purple pink gray red).sample

      name = (1..3).map { Faker::Games::Pokemon.name }.join(" ")
      payload = {
        name: name,
        color: color,
        regimen_items: [{ time_offset: 123, sequence_id: sequence.id }],
      }

      old_regimen_count = Regimen.count
      old_item_count = RegimenItem.count

      post :create, body: payload.to_json, format: :json

      expect(response.status).to eq(200)
      expect(Regimen.count).to be > old_regimen_count
      expect(RegimenItem.count).to be > old_item_count
      expect(json[:name]).to eq(name)
      expect(json[:color]).to eq(color)
    end

    it "creates a regimen that uses unbound variables" do
      sign_in user
      s = FakeSequence.with_parameters
      payload = { device: s.device,
                  name: "specs",
                  color: "red",
                  body: [
        {
          kind: "parameter_declaration",
          args: {
            label: "parent",
            default_value: {
              kind: "coordinate", args: { x: 0, y: 0, z: 0 },
            },
          },
        },
      ],
                  regimen_items: [{ time_offset: 100, sequence_id: s.id }] }
      post :create, body: payload.to_json, format: :json
      expect(response.status).to eq(200)
      declr = json.fetch(:body).first
      expect(declr).to be
      expect(declr.fetch(:kind)).to eq("parameter_declaration")
      path = [:args, :default_value, :args, :x]
      expect(declr.dig(*path)).to eq(0)
    end

    it "handles CeleryScript::TypeCheckError" do
      sign_in user
      s = FakeSequence.with_parameters
      payload = { device: s.device,
                 name: "specs",
                 color: "red",
                 body: [
        {
          kind: "parameter_application",
          args: {
            label: "parent",
            data_value: { kind: "safe_z", args: {} },
          },
        },
      ],
                 regimen_items: [
        { time_offset: 100, sequence_id: s.id },
      ] }
      post :create, body: payload.to_json, format: :json
      expect(response.status).to eq(422)
      msg = json.fetch(:error)
      expect(msg).to include("but got safe_z")
      # Make sure corpus entries are properly formatted.
      expect(msg).to include('"coordinate",')
    end

    it "limits the number of regimen items" do
      sign_in user
      color = %w(blue green yellow orange purple pink gray red).sample

      name = (1..3).map { Faker::Games::Pokemon.name }.join(" ")
      payload = {
        name: name,
        color: color,
        regimen_items: [
          { time_offset: 123, sequence_id: sequence.id },
          { time_offset: 456, sequence_id: sequence.id },
        ],
      }

      const_reassign(Regimens::Helpers, :ITEM_LIMIT, 1) do
        post :create, body: payload.to_json, format: :json
      end

      expect(response.status).to eq(422)
      expect(json).to eq(regimen_items: "Regimens can't have more than 500 items")
    end
  end
end
