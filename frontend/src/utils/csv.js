export function exportToCSV(filename, data, headers) {
  if (!data || !data.length) {
    alert("No data available to export");
    return;
  }
  
  const keys = Object.keys(headers);
  const headerLabels = Object.values(headers);
  
  const csvRows = [];
  
  // Header row
  csvRows.push(headerLabels.map(label => `"${String(label).replace(/"/g, '""')}"`).join(","));
  
  // Data rows
  for (const row of data) {
    const values = keys.map(key => {
      let val = row[key];
      // handle custom formatting if it's a nested path or boolean
      if (typeof val === "boolean") {
        val = val ? "Active" : "Inactive";
      }
      const escaped = String(val === null || val === undefined ? "" : val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  
  const csvContent = "\ufeff" + csvRows.join("\n"); // add UTF-8 BOM
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
