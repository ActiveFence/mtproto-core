const SocksClient = require("socks").SocksClient;
(async () => {
  const options = {
    proxy: {
      host: "45.13.75.173",
      port: 1180,
      type: 5,
      userId: "activefence",
      password: "fq6q9K93HS",
    },
    command: "connect",
    destination: {
      host: "192.30.253.113", // ipv4, ipv6, hostname. Hostnames work with v4a and v5.
      port: 80,
    },
    timeout: 600000,
  };

  const info = await SocksClient.createConnection(options);
  console.log(info.socket);
})();
