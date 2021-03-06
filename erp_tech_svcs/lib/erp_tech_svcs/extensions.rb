#railties
require 'erp_tech_svcs/extensions/railties/action_view/base'

#active record extensions
require 'erp_tech_svcs/extensions/active_record/base'
require 'erp_tech_svcs/extensions/active_record/has_file_assets'
require 'erp_tech_svcs/extensions/active_record/has_security_roles'
require 'erp_tech_svcs/extensions/active_record/protected_with_capabilities'
require 'erp_tech_svcs/extensions/active_record/has_capability_accessors'
require 'erp_tech_svcs/extensions/active_record/acts_as_versioned'
require 'erp_tech_svcs/extensions/active_record/has_relational_dynamic_attributes'
require 'erp_tech_svcs/extensions/active_record/has_dynamic_attribute_helpers'
require 'erp_tech_svcs/extensions/active_record/has_user_defined_data'

#sorcery
require 'erp_tech_svcs/extensions/sorcery/user_activation'