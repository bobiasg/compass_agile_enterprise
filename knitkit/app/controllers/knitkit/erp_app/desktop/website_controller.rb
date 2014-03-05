module Knitkit
  module ErpApp
    module Desktop
      class WebsiteController < Knitkit::ErpApp::Desktop::AppController
        IGNORED_PARAMS = %w{action controller id}

        before_filter :set_website, :only => [:export, :website_publications, :set_viewing_version,
                                              :activate_publication, :publish, :update, :delete]

        def index
          render :json => {:sites => Website.all}
        end

        def build_content_tree

          tree = []

          if @website

            @website_primary_host = @website.config_value('primary_host')

            website_hash = {
                :text => @website.name,
                :configurationId => @website.configurations.first.id,
                :iconCls => 'icon-globe_disconnected',
                :id => "website_#{@website.id}",
                :leaf => false,
                :url => "http://#{@website_primary_host}",
                :name => @website.name,
                :title => @website.title,
                :subtitle => @website.subtitle,
                :isWebsite => true,
                :siteName => @website.name,
                :children => []
            }

            #handle sections
            sections_hash = {:text => 'Sections/Web Pages', :isSectionRoot => true, :websiteId => @website.id,
                             :iconCls => 'icon-ia', :leaf => false, :children => []}

            @website.website_sections.positioned.each do |website_section|
              sections_hash[:children] << build_section_hash(website_section)
            end

            website_hash[:children] << sections_hash

            #added website to main tree
            tree << sections_hash

          end

          render :json => tree
        end

        def build_host_hash

          tree = []

          if @website
            #handle hosts
            hosts_hash = {:text => 'Host mappings', :iconCls => 'icon-gear',
                          :isHostRoot => true, :websiteId => @website.id,
                          :leaf => false, :children => []}
            website.hosts.each do |website_host|

              hosts_hash[:children] << {:text => website_host.attributes['host'], :websiteHostId => website_host.id,
                                        :host => website_host.attributes['host'], :iconCls => 'icon-globe',
                                        :url => "http://#{website_host.attributes['host']}",
                                        :isHost => true, :leaf => true, :children => []}
            end
            tree << hosts_hash

          end

          render :json => tree
        end

        def build_menu_tree

          tree = []

          if @website
            menus_hash = {:text => 'Menus', :iconCls => 'icon-content', :isMenuRoot => true,
                          :websiteId => @website.id, :leaf => false, :children => []}

            website.website_navs.each do |website_nav|
              menu_hash = {:text => website_nav.name, :websiteNavId => website_nav.id, :websiteId => @website.id, :canAddMenuItems => true,
                           :iconCls => 'icon-index', :isWebsiteNav => true, :leaf => false, :children => []}

              menu_hash[:children] = website_nav.website_nav_items.positioned.map { |item| build_menu_item_hash(website) }
              menus_hash[:children] << menu_hash

            end
            tree << menus_hash
          end
          render :json => tree
        end

        def website_publications
          sort_hash = params[:sort].blank? ? {} : Hash.symbolize_keys(JSON.parse(params[:sort]).first)
          sort = sort_hash[:property] || 'version'
          dir = sort_hash[:direction] || 'DESC'
          limit = params[:limit] || 9
          start = params[:start] || 0

          published_websites = @website.published_websites.order("#{sort} #{dir}").limit(limit).offset(start)

          #set site_version. User can view different versions. Check if they are viewing another version
          site_version = @website.active_publication.version
          if !session[:website_version].blank? && !session[:website_version].empty?
            site_version_hash = session[:website_version].find { |item| item[:website_id] == @website.id }
            site_version = site_version_hash[:version].to_f unless site_version_hash.nil?
          end

          PublishedWebsite.class_exec(site_version) do
            cattr_accessor :site_version
            self.site_version = site_version

            def viewing
              self.version == self.site_version
            end
          end

          render :inline => "{\"success\":true, \"results\":#{published_websites.count},
                            \"totalCount\":#{@website.published_websites.count},
                            \"data\":#{published_websites.to_json(
              :only => [:comment, :id, :version, :created_at, :active],
              :methods => [:viewing, :published_by_username])} }"
        end

        def activate_publication
          begin
            current_user.with_capability('activate', 'Website') do
              @website.set_publication_version(params[:version].to_f, current_user)

              render :json => {:success => true}
            end
          rescue ErpTechSvcs::Utils::CompassAccessNegotiator::Errors::UserDoesNotHaveCapability => ex
            render :json => {:success => false, :message => ex.message}
          end
        end

        def set_viewing_version
          if session[:website_version].blank?
            session[:website_version] = []
            session[:website_version] << {:website_id => @website.id, :version => params[:version]}
          else
            session[:website_version].delete_if { |item| item[:website_id] == @website.id }
            session[:website_version] << {:website_id => @website.id, :version => params[:version]}
          end

          render :json => {:success => true}
        end

        def publish
          begin
            current_user.with_capability('publish', 'Website') do
              @website.publish(params[:comment], current_user)

              render :json => {:success => true}
            end
          rescue ErpTechSvcs::Utils::CompassAccessNegotiator::Errors::UserDoesNotHaveCapability => ex
            render :json => {:success => false, :message => ex.message}
          end
        end

        def new
          begin
            Website.transaction do
              current_user.with_capability('create', 'Website') do
                website = Website.new
                website.subtitle = params[:subtitle]
                website.title = params[:title]
                website.name = params[:name]

                # create homepage
                website_section = WebsiteSection.new
                website_section.title = "Home"
                website_section.in_menu = true
                website.website_sections << website_section

                website.save
                website.setup_default_pages

                #set default publication published by user
                first_publication = website.published_websites.first
                first_publication.published_by = current_user
                first_publication.save

                website.hosts << WebsiteHost.create(:host => params[:host])
                website.configurations.first.update_configuration_item(ConfigurationItemType.find_by_internal_identifier('primary_host'), params[:host])
                website.save

                website.publish("Publish Default Sections", current_user)

                PublishedWebsite.activate(website, 1, current_user)

                render :json => {:success => true}
              end
            end
          rescue Exception => ex
            Rails.logger.error("#{ex.message} + #{ex.backtrace.join("\n")}")
            render :json => {:success => false, :message => ex.message}
          end

        end

        def update
          begin
            current_user.with_capability('edit', 'Website') do
              @website.name = params[:name]
              @website.title = params[:title]
              @website.subtitle = params[:subtitle]

              render :json => @website.save ? {:success => true} : {:success => false}
            end
          rescue ErpTechSvcs::Utils::CompassAccessNegotiator::Errors::UserDoesNotHaveCapability => ex
            render :json => {:success => false, :message => ex.message}
          end
        end

        def delete
          begin
            current_user.with_capability('delete', 'Website') do
              render :json => @website.destroy ? {:success => true} : {:success => false}
            end
          rescue ErpTechSvcs::Utils::CompassAccessNegotiator::Errors::UserDoesNotHaveCapability => ex
            render :json => {:success => false, :message => ex.message}
          end
        end

        def export
          zip_path = @website.export
          send_file(zip_path.to_s, :stream => false) rescue raise "Error sending #{zip_path} file"
        end

        # TODO add role restriction to this
        def import
          result, message = Website.import(params[:website_data], current_user)

          render :inline => {:success => result, :message => message}.to_json
        ensure
          FileUtils.rm_r File.dirname(zip_path) rescue nil
        end

        def add_host
          begin
            current_user.with_capability('create', 'WebsiteHost') do
              website = Website.find(params[:id])
              website_host = WebsiteHost.create(:host => params[:host])
              website.hosts << website_host
              website.save

              render :json => {
                  :success => true,
                  :node => {
                      :text => website_host.attributes['host'],
                      :websiteHostId => website_host.id,
                      :host => website_host.attributes['host'],
                      :iconCls => 'icon-globe',
                      :url => "http://#{website_host.attributes['host']}",
                      :isHost => true,
                      :leaf => true,
                      :children => []}
              }
            end
          rescue Exception => ex
            Rails.logger.error("#{ex.message} + #{ex.backtrace}")
            render :json => {:success => false, :message => ex.message}
          end
        end

        def update_host
          begin
            current_user.with_capability('edit', 'WebsiteHost') do
              website_host = WebsiteHost.find(params[:id])
              website_host.host = params[:host]
              website_host.save

              render :json => {:success => true}
            end
          rescue ErpTechSvcs::Utils::CompassAccessNegotiator::Errors::UserDoesNotHaveCapability => ex
            render :json => {:success => false, :message => ex.message}
          end
        end

        def delete_host
          begin
            current_user.with_capability('delete', 'WebsiteHost') do
              render :json => WebsiteHost.destroy(params[:id]) ? {:success => true} : {:success => false}
            end
          rescue ErpTechSvcs::Utils::CompassAccessNegotiator::Errors::UserDoesNotHaveCapability => ex
            render :json => {:success => false, :message => ex.message}
          end
        end

        protected

        def set_website
          if params[:id]
            @website = Website.find(params[:id])
          else
            @website = Website.count > 1 ? Website.first : nil
          end

          @website_primary_host = @website.nil? ? nil : website.config_value('primary_host')
        end

      end #WebsiteController
    end #Desktop
  end #ErpApp
end #Knitkit
