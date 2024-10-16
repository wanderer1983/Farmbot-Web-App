require "spec_helper"
# require_relative "../../lib/log_service"

describe LogService do
  normal_hash = ->() do
    return {
             z: 0,
             y: 0,
             x: 0,
             type: "info",
             major_version: 8,
             message: "HQ FarmBot TEST 123 Pin 13 is 0",
             created_at: 1512585641,
             channels: [],
           }
  end

  normal_payl = normal_hash[].to_json

  let!(:device) { FactoryBot.create(:device) }
  let!(:device_id) { device.id }
  let!(:fake_delivery_info) do
    FakeDeliveryInfo.new("bot.device_#{device_id}.logs", device)
  end

  it "sends errors to rollbar" do
    expect(Rollbar).to receive(:error)
    LogService.new().deliver("") # Will raise NoMethodError
  end

  it "has a log_channel" do
    calls = Transport.current.log_channel.calls[:bind]
    expect(calls).to include(["amq.topic", { routing_key: "bot.*.logs" }])
  end

  it "has a telemetry_channel" do
    calls = Transport.current.telemetry_channel.calls[:bind]
    call = ["amq.topic", { :routing_key => "bot.*.telemetry" }]
    expect(calls).to include(call)
  end

  it "creates new messages in the DB when called" do
    Log.destroy_all
    b4 = Log.count
    LogService.new.process(fake_delivery_info, normal_payl)
    expect(Log.count).to be > b4
  end

  it "warns the user that they've been throttled" do
    data = AmqpLogParser::DeliveryInfo.new
    data.device_id = FactoryBot.create(:device).id
    time = Time.now
    expect_any_instance_of(Device).to receive(:maybe_throttle).with(time)
    LogService.new.warn_user(data, time)
  end

  it "handles bad params" do
    expect do
      LogService.new.process(fake_delivery_info, {})
    end.to raise_error(Mutations::ValidationException)
  end

  it "handles malformed params" do
    expect do
      LogService.new.process(fake_delivery_info, "}}{{")
    end.to raise_error(Mutations::ValidationException)
  end

  it "throttles a device that sends too many logs" do
    violation = ThrottlePolicy::Violation.new(Time.now, "whatever")
    return_error = receive(:violation_for).with(any_args).and_return(violation)
    expect(LogService::THROTTLE_POLICY).to(return_error)
    j = normal_hash[].to_json
    LogService.new.process(fake_delivery_info, j)
  end

  it "does not save `fun`, `debug` or `nil` logs" do
    ["fun", "debug", nil].map do |type|
      Log.destroy_all
      j = normal_hash[].merge(type: type).to_json
      LogService.new.process(fake_delivery_info, j)
      if Log.count != 0
        opps = "Expected there to be no #{type.inspect} logs. " \
        "There are, though. -RC"
        fail(opps)
      end
      expect(Log.count).to be 0
    end
  end
end
