// Simple mock to simulate the Baseline Protocol message exchange between buyer/supplier/auditor
const listeners = {};
function on(topic, fn) {
  listeners[topic] = listeners[topic] || [];
  listeners[topic].push(fn);
}

function publish(topic, msg) {
  (listeners[topic] || []).forEach(fn => setTimeout(() => fn(msg), 0));
}

module.exports = { on, publish };
