module.exports = {
	"nagiosServerHost": "http://10.69.0.19",
	"nagiosServerCgiPath": "/nagios/cgi-bin",
	// TLS certificates are validated by default. Set this to true only if your
	// Nagios server uses a self-signed or otherwise invalid certificate.
	// Disabling validation allows man-in-the-middle attacks against the
	// credentials this proxy injects.
	"nagiosServerAllowSelfSigned": false,
	"auth": true,
	"username": "nagiosadmin",
	"password": "change-this-to-the-password"
}
