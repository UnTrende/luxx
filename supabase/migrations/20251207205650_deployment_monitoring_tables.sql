-- Create deployment monitoring table
CREATE TABLE IF NOT EXISTS deployment_monitoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase VARCHAR(50),
  feature VARCHAR(100),
  status VARCHAR(20),
  error_rate DECIMAL(5,4),
  requests_per_minute INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50),
  user_id UUID,
  ip INET,
  details JSONB,
  severity VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deployment_monitoring_phase ON deployment_monitoring(phase);
CREATE INDEX IF NOT EXISTS idx_deployment_monitoring_feature ON deployment_monitoring(feature);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);