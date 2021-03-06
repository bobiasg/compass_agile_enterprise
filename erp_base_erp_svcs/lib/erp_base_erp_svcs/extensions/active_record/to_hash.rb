ActiveRecord::Base.class_eval do

  #takes array of method names and returns hash with key/value pairs of methods
  def to_hash(options={})
    {}.tap do |hash|
      #check for only option to get only attributes specified
      if options[:only]
        options[:only].each do |attribute|
          if attribute.is_a?(Hash)
            attribute.each do |k, v|
              k = k.to_sym
              v = v.to_sym
              hash[v] = self.send(k)
            end
          else
            attribute = attribute.to_sym
            hash[attribute] = self.send(attribute)
          end
        end
      else
        hash.merge!(self.attributes)
      end

      options.each do |key, value|
        next if [:only].include?(key)

        hash[key] = value
      end

    end #end hash tap
  end
end


