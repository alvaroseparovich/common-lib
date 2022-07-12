class TokenManager {
  constructor (AWS_SDK, SECRET_ID = process.env.SECRET_ID) {
    if (process.env.IS_LOCAL || process.env.IS_OFFLINE || process.env.SERVERLESS_TEST_ROOT) {
      console.log('TokenManager will use Profile:', process.env.AWS_PROFILE)
      const credentials = new AWS_SDK.SharedIniFileCredentials({ profile: process.env.PROFILE })
      AWS_SDK.config.credentials = credentials
    }

    this.secretManager = new AWS_SDK.SecretsManager({ region: process.env.REGION })
    this.SECRET_ID = SECRET_ID
    this.TOKEN = undefined
    this.timestamp = undefined
  }

  async getToken () {
    if (!this.TOKEN) { this.TOKEN = await this.getTokenOnSecretManager() }
    if (Date.now() - this.timestamp > 60000) { this.TOKEN = await this.getTokenOnSecretManager() }
    return this.TOKEN
  }

  async getTokenOnSecretManager () {
    try {
      this.timestamp = Date.now()
      const data = await this.secretManager.getSecretValue({ SecretId: this.SECRET_ID }).promise()
      if (data.SecretString) return JSON.parse(data.SecretString).token
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  static printConfig (SECRET_ID = 'RESOURCE_ID') { console.log(`\n    iamRoleStatements:\n    - Effect: "Allow"\n      Action:\n        - secretsmanager:GetSecretValue\n      Resource:\n      - arn:aws:secretsmanager:sa-east-1::secret:${SECRET_ID}\n`)}
}

module.exports = TokenManager