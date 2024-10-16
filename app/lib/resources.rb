module Resources
  DEVICE_REGEX = /device_\d*/
  ACTIONS = [DESTROY = "destroy", SAVE = "save"]
  # Resources eligible for the MQTT-based APIs
  ELIGIBLE_RESOURCES = [FarmEvent,
                        FarmwareInstallation,
                        Image,
                        Log,
                        Peripheral,
                        PinBinding,
                        PlantTemplate,
                        Point,
                        Regimen,
                        SavedGarden,
                        Sensor,
                        SensorReading,
                        Sequence,
                        Tool,
                        WebcamFeed]
  # Map stringy class names to real classes
  RESOURCES = ELIGIBLE_RESOURCES.reduce({}) do |acc, klass|
    acc[klass.to_s] = klass
    acc
  end

  # Map ActiveRecord class to a Mutations::Command class.
  MUTATION_MAPPING = {
    FarmwareInstallations => FarmwareInstallations,
    FarmEvent => FarmEvents,
    Image => Images,
    Log => Logs,
    Telemetries => Telemetries,
    Peripheral => Peripherals,
    PinBinding => PinBindings,
    PlantTemplate => PlantTemplates,
    Regimen => Regimens,
    SavedGarden => SavedGardens,
    Sensor => Sensors,
    SensorReading => SensorReadings,
    Sequence => Sequences,
    Tool => Tools,
    WebcamFeed => WebcamFeeds,
    #  SPECIAL CASES =============================
    #    These resources don't follow usual
    #    naming conventions.
    Plant => Points,
    Point => Points,
    ToolSlot => Points,
    Weed => Points,
  }
end # Resources
