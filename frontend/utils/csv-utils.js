/**
 * Utility functions for CSV data generation and export
 * Provides functions to convert poll data to CSV format and trigger downloads
 */

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
    
    // Add poll metadata as header
    csvRows.push(`"Poll: ${poll.title}"`);
    csvRows.push(`"Code: ${poll.code}"`);
    csvRows.push(`"Total Responses: ${poll.totalResponses}"`);
    csvRows.push(`"Created: ${new Date(poll.createdAt).toLocaleDateString()}"`);
    csvRows.push(''); // Empty row for separation
    
    // Process each question and its results
    results.forEach((result, index) => {
        csvRows.push(`"Question ${index + 1}: ${result.question}"`);
        csvRows.push('"Option","Votes","Percentage"');
        
        // Add options and their vote counts
        Object.entries(result.results).forEach(([option, count]) => {
            const percentage = result.totalResponses > 0 
                ? ((count / result.totalResponses) * 100).toFixed(1) 
                : '0.0';
            csvRows.push(`"${escapeCSV(option)}",${count},${percentage}%`);
        });
        
        csvRows.push(''); // Empty row between questions
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
    // Replace double quotes with two double quotes to escape them
    return str.replace(/"/g, '""');
}

/**
 * Triggers a download of the generated CSV file
 * @param {String} csvContent - The CSV content to download
 * @param {String} fileName - Name for the downloaded file
 */
export function downloadCSV(csvContent, fileName) {
    // Create a Blob with the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link and trigger the download
    const link = document.createElement('a');
    
    // Support for browsers that have the download attribute
    if (navigator.msSaveBlob) {
        // IE10+
        navigator.msSaveBlob(blob, fileName);
        return;
    }
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', fileName);
    
    // Append to body, click, then remove
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
}