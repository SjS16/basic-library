# lib/tasks/db_backup.rake
namespace :db do
  desc "Backup the database"
  task backup: :environment do
    timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
    backup_dir = Rails.root.join("db_backups")
    FileUtils.mkdir_p(backup_dir)
    
    db_config = ActiveRecord::Base.connection_db_config
    db_path = db_config.database
    backup_path = backup_dir.join("backup_#{timestamp}.sqlite3")
    
    FileUtils.cp(db_path, backup_path)
    puts "✅ Database backed up to: #{backup_path}"
  end
end
