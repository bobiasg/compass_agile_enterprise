class WebsiteHost < ActiveRecord::Base
  attr_protected :created_at, :updated_at

  belongs_to :website
end
