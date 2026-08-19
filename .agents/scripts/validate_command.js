const fs = require('fs');
const path = require('path');

let rawInput = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  rawInput += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(rawInput || '{}');
    const commandLine = payload?.toolCall?.args?.CommandLine || '';

    // Load allowed_commands.json from parent directory (.agents/)
    const configPath = path.resolve(__dirname, '..', 'allowed_commands.json');
    let config = {
      defaultDecision: 'ask',
      exact: [],
      prefixes: [],
      blockedPrefixes: []
    };

    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    const trimmedCmd = commandLine.trim();

    // 1. Check blocked prefixes first
    const blockedMatch = (config.blockedPrefixes || []).find(prefix =>
      trimmedCmd.toLowerCase().startsWith(prefix.toLowerCase())
    );

    if (blockedMatch) {
      outputResult({
        decision: 'deny',
        reason: `El comando "${trimmedCmd}" fue bloqueado por coincidir con el patrón prohibido "${blockedMatch}".`
      });
      return;
    }

    // 2. Check exact matches
    const exactMatch = (config.exact || []).some(cmd =>
      trimmedCmd.toLowerCase() === cmd.toLowerCase()
    );

    if (exactMatch) {
      outputResult({
        decision: 'allow',
        reason: `Comando "${trimmedCmd}" permitido por coincidencia exacta.`
      });
      return;
    }

    // 3. Check allowed prefixes
    const prefixMatch = (config.prefixes || []).find(prefix =>
      trimmedCmd.toLowerCase().startsWith(prefix.toLowerCase())
    );

    if (prefixMatch) {
      outputResult({
        decision: 'allow',
        reason: `Comando "${trimmedCmd}" permitido por prefijo "${prefixMatch}".`
      });
      return;
    }

    // 4. Default decision
    const defaultDecision = config.defaultDecision || 'ask';
    outputResult({
      decision: defaultDecision,
      reason: defaultDecision === 'deny'
        ? `El comando "${trimmedCmd}" no está en la lista blanca de .agents/allowed_commands.json.`
        : `El comando "${trimmedCmd}" no está en la lista blanca. Se solicita confirmación.`
    });

  } catch (err) {
    outputResult({
      decision: 'ask',
      reason: `Error evaluando validación de comandos: ${err.message}`
    });
  }
});

function outputResult(result) {
  process.stdout.write(JSON.stringify(result) + '\n');
}
