require "spec_helper"

describe Api::DevicesController do
  include Devise::Test::ControllerHelpers

  describe "#destroy" do
    let(:password) { "password456" }
    let(:user) { FactoryBot.create(:user, password: password, password_confirmation: password) }

    resources = %w(sensor peripheral log pin_binding generic_pointer
                   tool_slot plant_template saved_garden sensor_reading
                   farmware_installation tool token_issuance)

    it "resets a bot" do
      sign_in user
      device = user.device
      f1 = Folder.create!(device: device, name: "f1", parent_id: nil, color: "red")
      f2 = Folder.create!(device: device, name: "f2", parent_id: f1.id, color: "red")
      f3 = Folder.create!(device: device, name: "f3", parent_id: f2.id, color: "red")
      resources.map do |resource|
        FactoryBot.create(resource.to_sym, device: device)
      end

      resources.map do |resource|
        expect(device.send(resource.pluralize).reload.count).to be > 0
      end

      device.update!(name: "#{SecureRandom.hex(10)}",
                     mounted_tool_id: device.tools.first.id)

      run_jobs_now { post :reset, body: { password: password }.to_json }

      resources
        .without("token_issuance")
        .map do |resource|
        count = device.send(resource.pluralize).reload.count
        if count > 0
          did_not_delete = "Expected #{resource} count to be 0 but got #{count}"
          fail(did_not_delete)
        end
      end
      expect(device.reload.name).to eq("FarmBot")
      expect(device.alerts.count).to eq(1)
      expect(device.token_issuances.count).to_not be > 1
    end

    it "can't reset a device if credentials are missing" do
      sign_in user
      device = user.device

      run_jobs_now { post :reset, body: {}.to_json }
      expect(response.status).to eq(422)
      expect(json.fetch(:password)).to eq("Password is required")
    end
  end
end
