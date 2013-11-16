module ErpBaseErpSvcs
	module Extensions
		module ActiveRecord
			module HasContact
				def self.included(base)
				  base.extend(ClassMethods)
				end

				module ClassMethods
				  def has_contact
            extend HasContact::SingletonMethods
  					include HasContact::InstanceMethods
  					
					  after_initialize :initialize_contact
  					after_create :save_contact
  					after_update :save_contact
  					after_destroy :destroy_contact
					
					  has_one :contact, :as => :contact_mechanism
					  
					  [:purpose,
					    :purposes,
					    :is_primary,
					    :is_primary=,
					    :is_primary?].each { |m| delegate m, :to => :contact }
				  end
				end

				module SingletonMethods
				end

				module InstanceMethods
				  
				  def save_contact
					  self.contact.save
          end

          def contact_purpose_id
            self.contact_purpose ? contact_purpose.id : nil
          end
				  
				  def contact_purpose
            contact.contact_purposes.count == 0 ? nil : contact.contact_purposes.first
          end

          # return all contact purposes
          def contact_purposes
            contact.contact_purposes
          end

				  def destroy_contact
					  self.contact.destroy unless self.contact.nil?
				  end

				  def initialize_contact
            if self.new_record? and self.contact.nil?
              self.contact = Contact.new
              self.contact.description = self.description
            end
          end
           
				end
				
			end #HasContact
		end #ActiveRecord
	end #Extensions
end #ErpBaseErpSvcs
