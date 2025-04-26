document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const emailInput = document.getElementById('emailInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContent = document.getElementById('resultsContent');
    const historyList = document.getElementById('historyList');
    const emptyHistory = document.getElementById('emptyHistory');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Refresh history list when history tab is opened
            if (tabId === 'history') {
                loadHistory();
            }
        });
    });
    
    // Load any existing history from localStorage
    loadHistory();
    
    // Analyze button click handler
    analyzeBtn.addEventListener('click', async function() {
        const emailContent = emailInput.value.trim();
        
        if (!emailContent) {
            alert('Please paste an email to analyze');
            return;
        }
        
        // Show loading state
        loadingIndicator.style.display = 'block';
        resultsContent.innerHTML = '';
        
        try {
            // Call the Flask backend API
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailContent })
            });
            
            if (!response.ok) {
                throw new Error('Server error: ' + response.status);
            }
            
            const data = await response.json();
            
            // Process and display the results
            const analysisResult = {
                originalEmail: emailContent,
                is_phishing: data.prediction === "Phishing",
                confidence: data.confidence,
                features: generateFeatures(data)
            };
            
            displayResults(analysisResult);
            saveToHistory(emailContent, analysisResult);
        } catch (error) {
            console.error('Error:', error);
            resultsContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Analysis failed</h3>
                    <p>${error.message || 'An error occurred during analysis'}</p>
                </div>
            `;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
    
    // Generate features from API response
    function generateFeatures(apiData) {
        const isPhishing = apiData.prediction === "Phishing";
        
        return {
            "Suspicious Keywords": {
                suspicious: apiData.suspicious_count > 0,
                message: `Found ${apiData.suspicious_count} red flags`
            },
            "Prediction Confidence": {
                suspicious: isPhishing,
                message: `${apiData.confidence}% confident`
            },
            "Classification": {
                suspicious: isPhishing,
                message: isPhishing ? "Classified as phishing" : "Classified as safe"
            },
            "AI Analysis": {
                suspicious: isPhishing,
                message: isPhishing ? "High-risk content detected" : "Email appears legitimate"
            }
        };
    }
    
    // Clear button click handler
    clearBtn.addEventListener('click', function() {
        emailInput.value = '';
        resultsContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📧</div>
                <h3>No email analyzed yet</h3>
                <p>Paste an email in the input field and click "Analyze" to check for phishing attempts</p>
            </div>
        `;
    });
    
    // Clear history button
    clearHistoryBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all history?')) {
            localStorage.removeItem('phishingDetectionHistory');
            loadHistory(); // This will show empty state
        }
    });
    
    // Function to display analysis results
    function displayResults(data) {
        const isPhishing = data.is_phishing;
        const confidence = data.confidence;
        const features = data.features;
        
        let featuresHTML = '';
        for (const [feature, value] of Object.entries(features)) {
            featuresHTML += `
                <div class="feature-item">
                    <span class="feature-name">${feature}</span>
                    <span class="feature-value ${value.suspicious ? 'danger-text' : 'safe-text'}">
                        ${value.suspicious ? '⚠️ ' : '✓ '}${value.message}
                    </span>
                </div>
            `;
        }
        
        resultsContent.innerHTML = `
            <div class="result-header">
                <div class="verdict-icon ${isPhishing ? 'phishing' : 'safe'}">
                    ${isPhishing ? '⚠️' : '✓'}
                </div>
                <div>
                    <div class="verdict-text">
                        ${isPhishing ? 'Phishing Detected' : 'Legitimate Email'}
                    </div>
                    <div class="confidence">Confidence: ${confidence}%</div>
                </div>
            </div>
            <div class="features-list">
                ${featuresHTML}
            </div>
        `;
    }
    
    // Save analysis to history (using localStorage)
    function saveToHistory(emailContent, analysisData) {
        // Get existing history or create empty array
        const history = JSON.parse(localStorage.getItem('phishingDetectionHistory')) || [];
        
        // Create new history item
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            emailPreview: emailContent.substring(0, 100) + (emailContent.length > 100 ? '...' : ''),
            isPhishing: analysisData.is_phishing,
            confidence: analysisData.confidence,
            fullAnalysis: analysisData
        };
        
        // Add to beginning of array (newest first)
        history.unshift(historyItem);
        
        // Save back to localStorage
        localStorage.setItem('phishingDetectionHistory', JSON.stringify(history));
        
        // Update history display if on history tab
        if (document.querySelector('.tab[data-tab="history"]').classList.contains('active')) {
            loadHistory();
        }
    }
    
    // Load history from localStorage
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('phishingDetectionHistory')) || [];
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            emptyHistory.style.display = 'block';
            return;
        }
        
        emptyHistory.style.display = 'none';
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${item.isPhishing ? 'phishing' : 'safe'}`;
            historyItem.innerHTML = `
                <div class="history-content" title="${item.emailPreview}">
                    ${item.isPhishing ? '⚠️ Phishing detected' : '✓ Legitimate email'} - ${item.emailPreview}
                </div>
                <div class="history-date">
                    ${new Date(item.timestamp).toLocaleString()}
                </div>
            `;
            
            // Click handler to view details
            historyItem.addEventListener('click', () => {
                // Switch to detector tab
                document.querySelector('.tab[data-tab="detector"]').click();
                
                // Display the historical analysis
                emailInput.value = item.fullAnalysis.originalEmail || item.emailPreview;
                displayResults(item.fullAnalysis);
            });
            
            historyList.appendChild(historyItem);
        });
    }
});