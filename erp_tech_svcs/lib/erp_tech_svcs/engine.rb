module ErpTechSvcs
  class Engine < Rails::Engine
    config.erp_tech_svcs = ErpTechSvcs::Config

    isolate_namespace ErpTechSvcs

	  ActiveSupport.on_load(:active_record) do
      include ErpTechSvcs::Extensions::ActiveRecord::HasSecurityRoles
      include ErpTechSvcs::Extensions::ActiveRecord::HasFileAssets
      include ErpTechSvcs::Extensions::ActiveRecord::ProtectedByCapabilities
      include ErpTechSvcs::Extensions::ActiveRecord::HasCapabilityAccessors
      include ErpTechSvcs::Extensions::ActiveRecord::HasRelationalDynamicAttributes
      include ErpTechSvcs::Extensions::ActiveRecord::HasDynamicAttributeHelpers
      include ErpTechSvcs::Extensions::ActiveRecord::HasUserDefinedData
    end

    ErpBaseErpSvcs.register_as_compass_ae_engine(config, self)
    
  end
end
