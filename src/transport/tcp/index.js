const SocksClient = require("socks").SocksClient;
const { Obfuscated } = require("../obfuscated");

class TCP extends Obfuscated {
  constructor(dc) {
    super();

    this.dc = dc;
  }

  get isAvailable() {
    return this.socket && this.socket.writable;
  }

  async connect() {
    this.stream = new Uint8Array();

    const options = {
      proxy: {
        host: "45.13.75.190",
        port: 1180,
        type: 5,
        userId: "activefence",
        password: "fq6q9K93HS",
      },
      command: "connect",
      destination: {
        host: this.dc.ip,
        port: this.dc.port,
      },
    };

    const info = await SocksClient.createConnection(options);
    this.socket = info.socket;
    this.socket.on("data", this.handleData.bind(this));
    this.socket.on("error", this.handleError.bind(this));
    this.socket.on("close", this.handleClose.bind(this));
    await this.handleConnect();
  }

  async handleData(data) {
    const bytes = new Uint8Array(data);

    const deobfuscatedBytes = await this.deobfuscate(bytes);

    this.stream = new Uint8Array([...this.stream, ...deobfuscatedBytes]);

    // The minimum length is eight (transport error with a intermediate header)
    while (this.stream.length >= 8) {
      const dataView = new DataView(this.stream.buffer);
      const payloadLength = dataView.getUint32(0, true);

      if (payloadLength <= this.stream.length - 4) {
        const payload = this.stream.slice(4, payloadLength + 4);

        if (payloadLength === 4) {
          const code = dataView.getInt32(4, true) * -1;

          this.emit("error", {
            type: "transport",
            code,
          });
        } else {
          this.emit("message", payload.buffer);
        }

        this.stream = this.stream.slice(payloadLength + 4);
      } else {
        break;
      }
    }
  }

  async handleError(error) {
    this.emit("error", {
      type: "socket",
    });
  }

  async handleClose(hadError) {
    if (!this.socket.destroyed) {
      this.socket.destroy();
    }

    this.connect();
  }

  async handleConnect() {
    const initialMessage = await this.generateObfuscationKeys();

    this.socket.write(initialMessage);

    this.emit("open");
  }

  async send(bytes) {
    const intermediateBytes = this.getIntermediateBytes(bytes);

    const obfuscatedBytes = await this.obfuscate(intermediateBytes);

    this.socket.write(obfuscatedBytes);
  }
}

module.exports = { TCP };
