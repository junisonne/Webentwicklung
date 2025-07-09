/**
 * Converts poll results into a properly formatted CSV string
 * @param {Object} data - The poll data from the admin panel
 * @returns {String} CSV formatted string with headers and data rows
 */
export function generatePollResultsCSV(data) {
    if (!data || !data.poll || !data.results) {
        return '';
    }

    const { poll, results } = data;
    const csvRows = [];
    
    csvRows.push(`"Poll: ${poll.title}"`);
    csvRows.push(`"Code: ${poll.code}"`);
    csvRows.push(`"Total Responses: ${poll.totalResponses}"`);
    csvRows.push(`"Created: ${new Date(poll.createdAt).toLocaleDateString()}"`);
    csvRows.push(''); 
    
    results.forEach((result, index) => {
        csvRows.push(`"Question ${index + 1}: ${result.question}"`);
        csvRows.push('"Option","Votes","Percentage"');
        
        Object.entries(result.results).forEach(([option, count]) => {
            const percentage = result.totalResponses > 0 
                ? ((count / result.totalResponses) * 100).toFixed(1) 
                : '0.0';
            csvRows.push(`"${escapeCSV(option)}",${count},${percentage}%`);
        });
        
        csvRows.push('');
    });
    
    return csvRows.join('\n');
}

/**
 * Escapes special characters in CSV strings to prevent breaking the format
 * @param {String} str - The string to escape
 * @returns {String} Escaped string safe for CSV
 */
function escapeCSV(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/"/g, '""');
}

/**
 * Triggers a download of the generated CSV file
 * @param {String} csvContent - The CSV content to download
 * @param {String} fileName - Name for the downloaded file
 */
export function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, fileName);
        return;
    }
    
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', fileName);
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
}