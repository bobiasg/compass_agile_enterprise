##********************************************************************************************
## Work Effort Assignments - what is necessary to complete this work effort - Inventory
##********************************************************************************************
class WorkEffortInventoryAssignment < ActiveRecord::Base
  attr_protected :created_at, :updated_at

  belongs_to  :work_effort
  belongs_to  :inventory_entry

end
