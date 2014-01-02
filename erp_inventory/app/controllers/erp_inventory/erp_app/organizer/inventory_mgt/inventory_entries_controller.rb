module ErpInventory
  module ErpApp
    module Organizer
      module InventoryMgt
        class InventoryEntriesController < ::ErpApp::Organizer::BaseController

          def index
            offset = params[:start] || 0
            limit = params[:limit] || 25
            query_filter = params[:query_filter].blank? ? nil : params[:query_filter].strip

            inventory_entry_tbl = InventoryEntry.arel_table
            statement = InventoryEntry.order('created_at asc')

            unless query_filter.blank?
              statement = statement.where(inventory_entry_tbl[:description].matches(query_filter + '%'))
            end

            # Get total count of records
            total = statement.count

            # Apply limit and offset
            inventory_entries = statement.offset(offset).limit(limit)

            render :json => {:success => true, :total => total, :inventory_entries => inventory_entries.collect { |entry| entry.to_data_hash }}

          end

          def show_summary

            @inventory_entry = InventoryEntry.find(params[:id]) rescue nil

          end

          def show

            entry = InventoryEntry.find(params[:inventory_entry_id])
            render :json => {:success => true, :data => entry.to_data_hash }

          end

          def new
          end

          def create

            entry = InventoryEntry.new
            entry.description=params[:description]
            entry.sku=params[:sku]
            entry.number_available=params[:number_available]
            entry.save

            location_assignment = InventoryEntryLocation.new
            location_assignment.inventory_entry = entry
            location_assignment.facility_id = params[:inventory_facility]
            location_assignment.save

            render :json => {:success => true, :data => entry.to_hash(:only => [:id, :description, :created_at, :updated_at], :model => 'InventoryEntry') }
          end

          def edit
            puts "edit called"
          end

          def update

            entry = InventoryEntry.find(params[:inventory_entry_id])
            entry.description=params[:description]
            entry.sku=params[:sku]
            entry.number_available=params[:number_available]
            entry.save

            location_assignment = InventoryEntryLocation.new
            location_assignment.inventory_entry = entry
            location_assignment.facility_id = params[:inventory_facility]
            location_assignment.save

            render :json => {:success => true, :data => entry.to_hash(:only => [:id, :description, :created_at, :updated_at], :model => 'InventoryEntry') }

          end

          def destroy

            entry = InventoryEntry.find(params[:inventory_entry_id]).destroy
            render :json => { :success => true }

          end

        end
      end #InventoryMgt
    end #Organizer
  end #ErpApp
end #ErpInventory