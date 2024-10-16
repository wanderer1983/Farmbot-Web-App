require "spec_helper"

describe Device do
  let(:device) { FactoryBot.create(:device, users: [FactoryBot.create(:user)]) }
  let(:user) { device.users.first }
  # [timezone, local_ota_hour, expected]
  conversions = [
    # DST-free Timezones for easy testing:
    ["Africa/Addis_Ababa", 6, 3],
    ["Africa/Kampala", 22, 19],
    ["Africa/Lagos", 15, 14],
    ["Asia/Makassar", 2, 18],
    ["Asia/Omsk", 11, 5],
    ["Asia/Qatar", 0, 21],
    ["Asia/Seoul", 18, 9],
    ["Australia/Perth", 21, 13],
    ["Etc/GMT+4", 20, 0],
  ]

  it "converts legacy ota_hour to ota_hour_utc" do
    conversions.map do |(timezone, local_ota_hour, expected)|
      actual = Device.get_utc_ota_hour(timezone, local_ota_hour)
      expect(actual).to eq(expected)
    end
  end

  it "performs gradual upgrades of ota_hour => ota_hour_utc" do
    d = Device.new(timezone: "US/Arizona", ota_hour: 4)
    expect(d.ota_hour_utc).to eq(nil)
    d.validate
    expect(d.ota_hour_utc).to eq(11)
  end

  it "creates a token" do
    jwt = device.help_customer
    expect(jwt).to be_kind_of(String)
  end

  it "is associated with a user" do
    expect(device.users.first).to be_kind_of(User)
    expect(user.device).to be_kind_of(Device)
  end

  it "destroys dependent devices" do
    bot_id = device.id
    user_id = user.id
    user.destroy
    user_results = User.where(id: user_id).first
    bot_results = Device.where(id: bot_id).first
    expect(bot_results).to be_nil
    expect(user_results).to be_nil
  end

  it "calculates TZ offset in hours" do
    device.timezone = nil
    expect(device.tz_offset_hrs).to be 0
    device.timezone = "America/Chicago"
    expect([-5, -6, -7]).to include device.tz_offset_hrs # Remember DST!
  end

  it "sends specific users toast messages" do
    Transport.current.clear!
    hello = "Hello!"
    log = device.tell(hello)
    json, info = Transport.current.connection.calls[:publish].last
    json = JSON.parse(json)
    expect(info[:routing_key]).to eq("bot.device_#{device.id}.logs")
    expect(log.message).to eq(hello)
    expect(json["message"]).to eq(hello)
  end

  it "unthrottles a runaway device" do
    expect(device).to receive(:tell).and_return(Log.new)
    example = Time.now - 1.minute
    device.update!(throttled_until: example)
    expect(device.throttled_until).to eq(example)
    device.maybe_unthrottle
    expect(device.throttled_until).to eq(nil)
  end

  it "is a device" do
    expect(Device.new.is_device).to eq(true)
  end

  it "keeps track of unsent _ROUTINE_ emails" do
    🤖 = FactoryBot.create(:device)
    📧 = FactoryBot.create(:log, device: 🤖, channels: ["email"])
    🚑 = FactoryBot.create(:log, device: 🤖, channels: ["fatal_email"])
    🍞 = FactoryBot.create(:log, device: 🤖, channels: ["toast"])
    results = 🤖.unsent_routine_emails
    expect(results).to include(📧)
    expect(results).to_not include(🚑)
    expect(results).to_not include(🍞)
  end

  it "throttled emails about MQTT rate limiting" do
    device.update!(mqtt_rate_limit_email_sent_at: 2.days.ago)
    Device.connection_warning("device_#{device.id.to_s}")
    time = device.reload.mqtt_rate_limit_email_sent_at
    expect(time).to be > 1.minute.ago
    Device.connection_warning("device_#{device.id.to_s}")
    time2 = device.reload.mqtt_rate_limit_email_sent_at
    expect(time).to eq(time2)
  end

  it "enforces correct OTA hours" do
    expect { device.update!(ota_hour: -1) }.to raise_error(ActiveRecord::RecordInvalid)
    expect { device.update!(ota_hour: 24) }.to raise_error(ActiveRecord::RecordInvalid)
    device.update!(ota_hour: 4)
    expect(device.ota_hour).to eq(4)
  end

  it "sends upgrade request" do
    expect(Transport.current).to receive(:amqp_send).with(Device::UPGRADE_RPC,
                                                          device.id,
                                                          "from_clients")
    device.send_upgrade_request
  end
end
