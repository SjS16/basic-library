ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end

module ActionDispatch
  class IntegrationTest
    # Add HTTP Basic Auth header for all controller tests
    setup do
      credentials = ActionController::HttpAuthentication::Basic.encode_credentials(
        ENV["APP_USER"] || "admin",
        ENV["APP_PASS"] || "secret"
      )
      @headers = { "Authorization" => credentials }
    end

    # Override HTTP methods to include auth headers
    def get(path, **args)
      super(path, headers: @headers.merge(args[:headers] || {}), **args.except(:headers))
    end

    def post(path, **args)
      super(path, headers: @headers.merge(args[:headers] || {}), **args.except(:headers))
    end

    def patch(path, **args)
      super(path, headers: @headers.merge(args[:headers] || {}), **args.except(:headers))
    end

    def delete(path, **args)
      super(path, headers: @headers.merge(args[:headers] || {}), **args.except(:headers))
    end
  end
end
