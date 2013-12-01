$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "erp_forms/version"

# Provide a simple gemspec so you can easily use your
# project in your rails apps through git.
Gem::Specification.new do |s|
  s.platform    = Gem::Platform::RUBY
  s.name        = "erp_forms"
  s.version     = ErpForms::VERSION::STRING
  s.summary     = "ErpForms provides dynamic form capability to existing and dynamic models."
  s.description = "ErpForms provides dynamic form capability to existing and dynamic models. Form Builder coming soon."
  s.authors     = ["Adam Hull, Rick Koloski, Russell Holmes"]
  s.email       = ["russonrails@gmail.com"]
  s.homepage    = "http://development.compassagile.com"

  s.files = Dir["{public,app,config,db,lib,tasks}/**/*"] + ["GPL-3-LICENSE", "Rakefile", "README.rdoc"]
  s.test_files = Dir["spec/**/*"]

  s.add_dependency('friendly_id', '4.0.10.1')

  #compass dependencies
  s.add_dependency 'erp_app', '~> 3.1'
  s.add_development_dependency 'erp_dev_svcs', '~> 3.1'
end
