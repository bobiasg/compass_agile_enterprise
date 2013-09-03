module ErpTechSvcs
	module Extensions
		module ActiveRecord
			module HasSecurityRoles

        module Errors
          exceptions = %w[UserDoesNotHaveAccess]
          exceptions.each { |e| const_set(e, Class.new(StandardError)) }
        end

				def self.included(base)
					base.extend(ClassMethods)  	        	      	
				end

				module ClassMethods
				  def has_security_roles
				    extend HasSecurityRoles::SingletonMethods
    				include HasSecurityRoles::InstanceMethods
				  end
				end
				
				module SingletonMethods			
				end
						
				module InstanceMethods

          def roles_not
            SecurityRole.where("id NOT IN (#{self.security_roles.select(:id).to_sql})")
          end

				  def roles
					  self.security_roles
				  end

				  def add_role(role)
					  role = role.is_a?(SecurityRole) ? role : SecurityRole.find_by_internal_identifier(role.to_s)
            unless self.has_role?(role)
  					  self.security_roles << role
  					  self.save
  					end
				  end

          def add_roles(*passed_roles)
            passed_roles.flatten!
            passed_roles = passed_roles.first if passed_roles.first.is_a? Array
            passed_roles.each do |role|
              self.add_role(role)
            end
          end

          def remove_role(role)
            role = role.is_a?(SecurityRole) ? role : SecurityRole.find_by_internal_identifier(role.to_s)
            self.security_roles.delete(role) if has_role?(role)
				  end

          def remove_roles(*passed_roles)
            passed_roles.flatten!
            passed_roles.each do |role|
              self.remove_role(role)
            end
				  end

          def remove_all_roles
            self.security_roles = []
            self.save
          end

          def has_role?(*passed_roles)
            result = false
            passed_roles.flatten!
            passed_roles.each do |role|
              role_iid = role.is_a?(SecurityRole) ?  role.internal_identifier : role.to_s
              self.security_roles.each do |this_role|
                result = true if (this_role.internal_identifier == role_iid)
                break if result
              end
              break if result
            end
            result
          end
				end  
      end #HasSecurityRoles
    end #ActiveRecord
  end #Extensions
end #ErpTechSvcs
