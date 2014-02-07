module Knitkit
  module ErpApp
    module Desktop
      class AppController < ::ErpApp::Desktop::BaseController
        KNIT_KIT_ROOT = Knitkit::Engine.root.to_s

        def available_roles
          render :json => {:success => true, :availableRoles => SecurityRole.order('description ASC').all.collect{|role| role.to_hash(:only => [:internal_identifier, :description])}}
        end

        def websites
          websites = Website.order('name ASC').all

          tree = []
          websites.each do |website|
            @website_primary_host = website.config_value('primary_host')

            website_hash = {
              :text => website.name,
              :configurationId => website.configurations.first.id,
              :iconCls => 'icon-globe_disconnected',
              :id => "website_#{website.id}",
              :leaf => false,
              :url => "http://#{@website_primary_host}",
              :name => website.name,
              :title => website.title,
              :subtitle => website.subtitle,
              :isWebsite => true,
              :siteName => website.name,
              :children => []
            }

            #handle hosts
            hosts_hash = {:text => 'Hosts', :iconCls => 'icon-gear', :isHostRoot => true, :websiteId => website.id, :leaf => false, :children => []}
            website.hosts.each do |website_host|
              hosts_hash[:children] << {:text => website_host.attributes['host'], :websiteHostId => website_host.id, :host => website_host.attributes['host'], :iconCls => 'icon-globe', :url => "http://#{website_host.attributes['host']}", :isHost => true, :leaf => true, :children => []}
            end

            website_hash[:children] << hosts_hash

            #handle sections
            sections_hash = {:text => 'Sections/Web Pages', :isSectionRoot => true, :websiteId => website.id, :iconCls => 'icon-content', :leaf => false, :children => []}
            website.website_sections.positioned.each do |website_section|
              sections_hash[:children] << build_section_hash(website_section, website)
            end

            website_hash[:children] << sections_hash

            #handle menus
            menus_hash = {:text => 'Menus', :iconCls => 'icon-content', :isMenuRoot => true, :websiteId => website.id, :leaf => false, :children => []}
            website.website_navs.each do |website_nav|
              menu_hash = {:text => website_nav.name, :websiteNavId => website_nav.id, :websiteId => website.id, :canAddMenuItems => true, :iconCls => 'icon-index', :isWebsiteNav => true, :leaf => false, :children => []}
              menu_hash[:children] = website_nav.website_nav_items.positioned.map{|item|build_menu_item_hash(website, item)}
              menus_hash[:children] << menu_hash
            end

            website_hash[:children] << menus_hash

            #added website to main tree
            tree << website_hash
          end

          render :json => tree
        end

        protected

        def page
          offset = params[:start].to_f
          offset > 0 ? ((offset / params[:limit].to_f).to_i + 1) : 1
        end

        def per_page
          params[:limit].nil? ? 20 : params[:limit].to_i
        end

        def build_menu_item_hash(website, item)
          url = item.url
          linked_to_item_id = nil
          link_to_type = 'url'
          unless item.linked_to_item.nil?
            linked_to_item_id = item.linked_to_item_id
            link_to_type = item.linked_to_item.class.to_s.underscore
            url = "http://#{@website_primary_host}" + item.linked_to_item.path
          end

          menu_item_hash = {
            :text => item.title,
            :linkToType => link_to_type,
            :canAddMenuItems => true,
            :websiteId => website.id,
            :isSecured => item.is_secured?,
            :roles => item.roles.collect{|item| item.internal_identifier},
            :linkedToId => linked_to_item_id,
            :websiteNavItemId => item.id,
            :url => url,
            :iconCls => item.is_secured? ? 'icon-document_lock' : 'icon-document',
            :isWebsiteNavItem => true,
            :leaf => false
          }

          menu_item_hash[:children] = item.positioned_children.map{ |child| build_menu_item_hash(website, child)}

          menu_item_hash
        end

        def build_section_hash(website_section, website)
          website_section_hash = {
            :text => website_section.title,
            :path => website_section.path,
            :siteName => website.name,
            :siteId => website.id,
            :type => website_section.type,
            :isSecured => website_section.is_secured?,
            :roles => website_section.roles.collect{|item| item.internal_identifier},
            :isSection => website_section.is_section?,
            :isDocument => website_section.is_document_section?,
            :useMarkdown => website_section.use_markdown,
            :inMenu => website_section.in_menu,
            :renderWithBaseLayout => website_section.render_base_layout?,
            :hasLayout => !website_section.layout.blank?,
            :id => "section_#{website_section.id}",
            :url => "http://#{@website_primary_host}#{website_section.path}",
            :internal_identifier => website_section.internal_identifier
          }
          if (website_section.is_a?(OnlineDocumentSection) || website_section.type == 'OnlineDocumentSection')
            document_section = OnlineDocumentSection.find(website_section.id)
            if document_section.documented_item and document_section.documented_item_content
              website_section_hash[:contentInfo] = document_section.documented_item_content.content_hash
            end
          end  

          if website_section.is_a?(Blog) || website_section.type == 'Blog'
            website_section_hash[:isBlog] = true
            website_section_hash[:iconCls] = 'icon-blog'
            website_section_hash[:leaf] = true
          else
            website_section_hash[:leaf] = false
            website_section_hash[:children] = website_section.positioned_children.map {|child| build_section_hash(child, website)}
            website_section_hash[:isSecured] ? website_section_hash[:iconCls] = 'icon-document_lock' : website_section_hash[:iconCls] = 'icon-document'
          end
          
          if (website_section.is_a?(OnlineDocumentSection) || website_section.type == 'OnlineDocumentSection')
            website_section_hash[:iconCls] = 'icon-document_info'
          end

          website_section_hash
        end
        
      end#AppController
    end#Desktop
  end#ErpApp
end#Knitkit