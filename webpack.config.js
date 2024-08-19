const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    // Other configurations...
    plugins: [
        new webpack.DefinePlugin({
            'process.env.GOOGLE_SAFE_BROWSING_API_KEY': JSON.stringify(process.env.GOOGLE_SAFE_BROWSING_API_KEY),
            'process.env.VIRUSTOTAL_API_KEY': JSON.stringify(process.env.VIRUSTOTAL_API_KEY)
        })
    ]
};
