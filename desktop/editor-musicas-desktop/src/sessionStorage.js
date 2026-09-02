// Guarda a sessão de login (token) num arquivo local, pra o aluno não
// precisar logar toda vez que abrir o programa. Implementa a interface de
// "storage" que o supabase-js espera (getItem/setItem/removeItem).
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

function sessionFilePath() {
  return path.join(app.getPath("userData"), "session.json");
}

function readAll() {
  try {
    const raw = fs.readFileSync(sessionFilePath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(data) {
  try {
    fs.writeFileSync(sessionFilePath(), JSON.stringify(data), "utf-8");
  } catch (err) {
    console.error("Não consegui salvar a sessão localmente:", err);
  }
}

const fileStorage = {
  getItem: (key) => {
    const data = readAll();
    return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
  },
  setItem: (key, value) => {
    const data = readAll();
    data[key] = value;
    writeAll(data);
  },
  removeItem: (key) => {
    const data = readAll();
    delete data[key];
    writeAll(data);
  },
};

module.exports = { fileStorage };
