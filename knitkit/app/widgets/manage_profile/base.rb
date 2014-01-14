module Widgets
  module ManageProfile
    class Base < ErpApp::Widgets::Base

      def index
        @user = User.find(current_user)
        @individual = @user.party.business_party
        @email_addresses = @user.party.find_all_contacts_by_contact_mechanism(EmailAddress)
        @phone_numbers = @user.party.find_all_contacts_by_contact_mechanism(PhoneNumber)
        @postal_addresses = @user.party.find_all_contacts_by_contact_mechanism(PostalAddress)

        contact_purposes = ContactPurpose.all
        @purpose_hash={}
        contact_purposes.each do |p|
          @purpose_hash[p.description]=p.internal_identifier
        end

        countries= GeoCountry.all
        @countries_id=[]
        @countries_id << ["Country", "default"]
        countries.each do |c|
          @countries_id << [c.name, c.id]
        end

        states= GeoZone.all
        @states_id=[]
        @states_id << ["State", "default"]
        states.each do |s|
          @states_id << [s.zone_name, s.id]
        end

        render
      end

      def update_user_information
        #### Get appropriate models ####

        @user = User.find(current_user)
        @individual = @user.party.business_party

        @individual.current_first_name = params[:first_name]
        @individual.current_last_name = params[:last_name]
        @individual.current_middle_name = params[:middle_name]
        @individual.gender = params[:gender]
        @individual.birth_date = params[:birth_date]
        @user.email = params[:email]

        #### check validation then save and render message ####
        if @user.changed? || @individual.changed?
          if @user.valid? && @individual.valid?
            @user.save
            @individual.save
            @message = "User Information Updated"

            render :update => {:id => "#{@uuid}_result", :view => :success}
          else
            @message_cls = 'sexyerror'
            @message = "Error Updating User Information"
            render :update => {:id => "#{@uuid}_result", :view => :error}
          end
        else
          @message = "User Information Updated"
          render :update => {:id => "#{@uuid}_result", :view => :success}
        end

      end


      def update_password
        if @user = User.authenticate(current_user.username, params[:old_password])

          if !params[:new_password].blank? && !params[:password_confirmation].blank? && params[:new_password] == params[:password_confirmation]

            @user.password_confirmation= params[:password_confirmation]

            if @user.change_password!(params[:new_password])
              @message = "Password Updated"

              render :update => {:id => "#{@uuid}_result", :view => :success}
            else
              @message = "Error Updating Password"

              #### validation failed ####
              render :update => {:id => "#{@uuid}_result", :view => :error}
            end

          else
            #### password and password confirmation cant be blank or unequal ####
            @message = "Password Confirmation Must Match Password"

            render :update => {:id => "#{@uuid}_result", :view => :error}
          end
        else
          #### old password wrong ####
          @message = "Invalid Old Password"

          render :update => {:id => "#{@uuid}_result", :view => :error}
        end

      end

      def add_email_address
        begin
          email_address = params[:email_address].strip
          contact_purpose = params[:contact_purpose]

          email = current_user.party.update_or_add_contact_with_purpose(EmailAddress,
                                                                        ContactPurpose.find_by_internal_identifier(contact_purpose),
                                                                        {email_address: email_address})

          {:json => {success: true, message: 'Email added', email: email.to_hash(:only => [:id, :email_address],
                                                                                 :contact_purpose => email.contact_purpose.description)}}
        rescue Exception => ex
          Rails.logger.error ex.message
          Rails.logger.error ex.backtrace.join("\n")
          #TODO send out notification

          {:json => {success: false, message: 'Could not add email'}}
        end
      end

      def remove_email_address
        begin
          email_address_id = params[:email_address_id].strip

          EmailAddress.find(email_address_id).destroy

          {:json => {success: true, message: 'Email removed'}}
        rescue Exception => ex
          Rails.logger.error ex.message
          Rails.logger.error ex.backtrace.join("\n")
          #TODO send out notification

          {:json => {success: false, message: 'Could not remove email'}}
        end
      end

      def add_phone_number
        begin
          phone_number = params[:phone_number].strip
          contact_purpose = params[:contact_purpose]

          phone_number = current_user.party.update_or_add_contact_with_purpose(PhoneNumber,
                                                                               ContactPurpose.find_by_internal_identifier(contact_purpose),
                                                                               {phone_number: phone_number})

          {:json => {success: true, message: 'Phone number added', phone: phone_number.to_hash(:only => [:id, :phone_number],
                                                                                               :contact_purpose => phone_number.contact_purpose.description)}}
        rescue Exception => ex
          Rails.logger.error ex.message
          Rails.logger.error ex.backtrace.join("\n")
          #TODO send out notification

          {:json => {success: false, message: 'Could not add phone number'}}
        end
      end

      def remove_phone_number
        begin
          phone_number_id = params[:phone_number_id].strip

          PhoneNumber.find(phone_number_id).destroy

          {:json => {success: true, message: 'Phone number removed'}}
        rescue Exception => ex
          Rails.logger.error ex.message
          Rails.logger.error ex.backtrace.join("\n")
          #TODO send out notification

          {:json => {success: false, message: 'Could not remove phone number'}}
        end
      end

      def add_address
        begin
          address_line_1 = params[:address_line_1].strip
          address_line_2 = params[:address_line_2].strip
          city = params[:city].strip
          geo_zone_id = params[:state].strip
          postal_code = params[:postal_code].strip
          contact_purpose = params[:contact_purpose]

          postal_address = current_user.party.update_or_add_contact_with_purpose(PostalAddress,
                                                                                 ContactPurpose.find_by_internal_identifier(contact_purpose),
                                                                                 {
                                                                                     address_line_1: address_line_1,
                                                                                     address_line_2: address_line_2,
                                                                                     city: city,
                                                                                     geo_zone_id: geo_zone_id,
                                                                                     state: GeoZone.find(geo_zone_id).zone_name,
                                                                                     zip: postal_code,
                                                                                 })

          {:json => {success: true,
                     message: 'Address added',
                     address: postal_address.to_hash(:only => [:id, :address_line_1, :address_line_2,
                                                               :city, :state, :zip],
                                                     :contact_purpose => postal_address.contact_purpose.description)}}
        rescue Exception => ex
          Rails.logger.error ex.message
          Rails.logger.error ex.backtrace.join("\n")
          #TODO send out notification

          {:json => {success: false, message: 'Could not add address'}}
        end
      end

      def remove_address
        begin
          address_id = params[:address_id].strip

          PostalAddress.find(address_id).destroy

          {:json => {success: true, message: 'address removed'}}
        rescue Exception => ex
          Rails.logger.error ex.message
          Rails.logger.error ex.backtrace.join("\n")
          #TODO send out notification

          {:json => {success: false, message: 'Could not remove address'}}
        end
      end

      def update_contact_information
        @user= User.find(current_user)
        @email_addresses= @user.party.find_all_contacts_by_contact_mechanism(EmailAddress)
        @phone_numbers= @user.party.find_all_contacts_by_contact_mechanism(PhoneNumber)
        @postal_addresses= @user.party.find_all_contacts_by_contact_mechanism(PostalAddress)
        contact_type_in_use=false

        #### Updates email records ####
        @email_addresses.each_with_index do |e, i|
          if e.email_address != params[:email_addresses][i.to_s]
            email_address_args={:email_address => params[:email_addresses][i.to_s]}
            @user.party.update_or_add_contact_with_purpose(EmailAddress,
                                                           ContactPurpose.find_by_internal_identifier(params[:email_address_contact_purposes][i.to_s]),
                                                           email_address_args)
          end
        end

        #### Updates Phone Numbers ####
        @phone_numbers.each_with_index do |p, i|
          if p.phone_number != params[:phone_numbers][i.to_s]
            phone_number_args={:phone_number => params[:phone_numbers][i.to_s]}
            @user.party.update_or_add_contact_with_purpose(PhoneNumber,
                                                           ContactPurpose.find_by_internal_identifier(params[:phone_number_contact_purposes][i.to_s]),
                                                           phone_number_args)
          end
        end

        #### Updates Postal Addresses
        @postal_addresses.each_with_index do |a, i|
          postal_address_args= {}

          if a.address_line_1 != params[:postal_addresses][i.to_s][:address_line_1]
            postal_address_args[:address_line_1]= params[:postal_addresses][i.to_s][:address_line_1]
          end

          if a.address_line_2 != params[:postal_addresses][i.to_s][:address_line_2]
            postal_address_args[:address_line_2]= params[:postal_addresses][i.to_s][:address_line_2]
          end

          if a.city != params[:postal_addresses][i.to_s][:city]
            postal_address_args[:city]= params[:postal_addresses][i.to_s][:city]
          end

          if a.geo_zone_id != params[:postal_addresses][i.to_s][:state_id].to_i
            postal_address_args[:geo_zone_id]= params[:postal_addresses][i.to_s][:state_id].to_i
            postal_address_args[:state]= GeoZone.find(params[:postal_addresses][i.to_s][:state_id]).zone_name
          end

          if a.zip != params[:postal_addresses][i.to_s][:zip]
            postal_address_args[:zip]= params[:postal_addresses][i.to_s][:zip]
          end

          if a.geo_country_id != params[:postal_addresses][i.to_s][:country_id].to_i
            postal_address_args[:geo_country_id]= params[:postal_addresses][i.to_s][:country_id].to_i
            postal_address_args[:country]= GeoCountry.find(params[:postal_addresses][i.to_s][:country_id]).name
          end

          if !postal_address_args.empty?
            @user.party.update_or_add_contact_with_purpose(PostalAddress,
                                                           ContactPurpose.find_by_internal_identifier(params[:postal_address_contact_purposes][i.to_s]),
                                                           postal_address_args)
          end
        end

        #### Adds new email address ####
        if params[:new_email_address] != nil && params[:new_email_address] != ""
          if !contact_purpose_in_use?(@email_addresses, params[:new_email_address_contact_purpose])
            @user.party.update_or_add_contact_with_purpose(EmailAddress,
                                                           ContactPurpose.find_by_internal_identifier(params[:new_email_address_contact_purpose]),
                                                           :email_address => params[:new_email_address])
          else
            contact_type_in_use=true
          end
        end

        #### Adds new phone number ####
        if params[:new_phone_number] != nil && params[:new_phone_number] != ""
          if !contact_purpose_in_use?(@phone_numbers, params[:new_phone_number_contact_purpose])
            @user.party.update_or_add_contact_with_purpose(PhoneNumber,
                                                           ContactPurpose.find_by_internal_identifier(params[:new_phone_number_contact_purpose]),
                                                           :phone_number => params[:new_phone_number])
          else
            contact_type_in_use=true
          end
        end

        #### Adds new postal address ####
        new_postal_address_args= {}

        if params[:new_postal_address][:address_line_1] != "Address Line 1"
          new_postal_address_args[:address_line_1]= params[:new_postal_address][:address_line_1]
        end

        if params[:new_postal_address][:address_line_2] != "Address Line 2"
          new_postal_address_args[:address_line_2]= params[:new_postal_address][:address_line_2]
        end

        if params[:new_postal_address][:city] != "City"
          new_postal_address_args[:city]= params[:new_postal_address][:city]
        end

        if !params[:new_postal_address][:state_id].blank? and params[:new_postal_address][:state_id] != "default"
          new_postal_address_args[:geo_zone_id]= params[:new_postal_address][:state_id].to_i
          new_postal_address_args[:state]= GeoZone.find(params[:new_postal_address][:state_id]).zone_name
        end

        if params[:new_postal_address][:zip] != "Zipcode"
          new_postal_address_args[:zip]= params[:new_postal_address][:zip]
        end

        if !params[:new_postal_address][:country_id].blank? and params[:new_postal_address][:country_id] != "default"
          new_postal_address_args[:geo_country_id]= params[:new_postal_address][:country_id].to_i
          new_postal_address_args[:country]= GeoCountry.find(params[:new_postal_address][:country_id]).name
        end

        if !new_postal_address_args.empty?
          if !contact_purpose_in_use?(@postal_addresses, params[:new_postal_address_contact_purpose])
            @user.party.update_or_add_contact_with_purpose(PostalAddress,
                                                           ContactPurpose.find_by_internal_identifier(params[:new_postal_address_contact_purpose]),
                                                           new_postal_address_args)
          else
            contact_type_in_use=true
          end
        end

        #### Renders proper error or success message ####
        if contact_type_in_use
          @message = "New contacts cannot have the same contact type as old contacts"
          @message_cls = 'sexyerror'
          render :update => {:id => "#{@uuid}_result", :view => :index}
        else
          @message = "Your Contact Information Was Updated"
          render :update => {:id => "#{@uuid}_result", :view => :index}
        end

      end

      def contact_purpose_in_use?(contacts, purpose)
        result = false
        contacts.each do |e|
          if e.contact.contact_purposes[0].internal_identifier == purpose
            result = true
            break
          end
        end
        result
      end

      #should not be modified
      #modify at your own risk
      def locate
        File.dirname(__FILE__)
      end

      class << self
        def title
          "Manage Profile"
        end

        def widget_name
          File.basename(File.dirname(__FILE__))
        end

        def base_layout
          begin
            file = File.join(File.dirname(__FILE__), "/views/layouts/base.html.erb")
            IO.read(file)
          rescue
            return nil
          end
        end
      end
    end
  end
end

