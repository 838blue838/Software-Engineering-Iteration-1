module.exports = {
  default: {
    features: ['features/**/*.feature'],
    require: ['features/step_definitions/**/*.js'],
    timeout: 30000
  }
}