// Simple ERP connector stub — maps ERP record to claim schema
function fetchLatestSupplierRecord(supplierId) {
  // In real integration this would call SAP/Oracle API and map fields
  return {
    supplierId,
    data: {
      cert: 'ISO9001',
      emissions: 5
    }
  };
}

module.exports = { fetchLatestSupplierRecord };
