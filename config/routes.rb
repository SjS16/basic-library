Rails.application.routes.draw do
  resource :session
  resource :registration, only: [ :new, :create ]
  resources :passwords, param: :token
  get "me", to: "me#show"
  resource :profile, only: [ :show, :update ]
  post "profile/become_member", to: "profiles#become_member"
  resources :borrowers do
    collection do
      get :name_check
    end
    member do
      post :checkout_book
      post :return_book
      get :reading_list_export
    end
    resources :reading_statuses, only: [ :create, :update, :destroy ]
  end

  resources :borrow_requests, only: [ :index, :create ] do
    member do
      post :approve
      post :decline
      post :cancel
    end
  end

  post "borrowers/:borrower_id/wishlist_books", to: "wishlist_books#create"
  post "borrowers/:borrower_id/title_requests", to: "title_requests#create"

  resources :membership_requests, only: [ :index, :create ] do
    member do
      post :approve
      post :decline
    end
  end

  resources :membership_invites, only: [ :index, :create ] do
    member do
      post :accept
      post :decline
    end
  end

  get "invite_link", to: "invite_links#show"
  post "invite_link/regenerate", to: "invite_links#regenerate"
  post "invite_link/accept", to: "invite_links#accept"

  get "loans/overdue", to: "loans#overdue"
  post "loans/:id/bother", to: "loans#bother"
  patch "loans/:id", to: "loans#update"
  post "internal/due_reminders", to: "reminders#run"

  get "books/export", to: "books#export"
  resources :books do
    collection do
      get :open_library
    end
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "home#index"
end
