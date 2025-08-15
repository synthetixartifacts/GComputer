class ApiCall {
    // Store current stream controller for cancellation
    static currentStreamController = null;

    static getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    }

    static getHeader(method) {
        const headers = {
            'X-CSRF-TOKEN': this.getCsrfToken()
        };

        if (method !== 'GET') {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }

    static redirectToLogin() {
        window.location.href = '/login';
    }

    // Standard Call
    static async call(method, url, data = null, callable = false) {
        const headers = this.getHeader(method);
        const options = {
            method: method,
            headers: headers,
        };

        if (method !== 'GET' && data !== null) {
            if (data instanceof FormData) {
                delete headers['Content-Type'];
                options.body = data;
            } else {
                options.body = JSON.stringify(data);
            }
        }

        console.warn('API CALL |', url + ' |', options);

        try {
            const response = await fetch(url, options);

            if (response.status === 401) {
                this.redirectToLogin();
                return;
            }

            if (response.redirected && response.url.includes('login')) {
                window.location.href = response.url;
                return;
            }

            const jsonResponse = await response.json();

            console.warn('API RESPONSE |', jsonResponse.message + ' |', jsonResponse);

            if (callable) {
                callable(jsonResponse);
            }

            return jsonResponse;
        } catch (error) {
            console.error('ApiCall - Error fetching API response:', error);
            return error;
        }
    }

    // Method to cancel current stream
    static cancelCurrentStream() {
        if (this.currentStreamController) {
            console.warn('STREAM CANCELLED | Aborting current stream');
            this.currentStreamController.abort();
            this.currentStreamController = null;
        }
    }

    // STREAM Call
    static async streamCall(method, url, data, callable) {
        // Cancel any existing stream
        this.cancelCurrentStream();

        // Create new AbortController for this stream
        this.currentStreamController = new AbortController();

        const headers = this.getHeader(method);
        const options = {
            method: method,
            headers: headers,
            signal: this.currentStreamController.signal
        };

        if (method !== 'GET' && data !== null) {
            options.body = JSON.stringify(data);
        }

        try {
            console.warn('IMPORTANT | API STEAM CALL | ', url, options);

            const response = await fetch(url, options);

            if (response.status === 401) {
                this.redirectToLogin();
                return;
            }

            if (!response.ok) {
                callable({
                    status: response.status,
                    message: `HTTP error! status: ${response.status}`
                });
                callable('DONE-ERROR');
                return;
            }

            if (response.redirected && response.url.includes('login')) {
                window.location.href = response.url;
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        callable('DONE');
                        this.currentStreamController = null;
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    let doubleNewLineIndex;
                    while ((doubleNewLineIndex = buffer.indexOf('\n\n')) !== -1) {
                        const eventString = buffer.slice(0, doubleNewLineIndex).trim();
                        buffer = buffer.slice(doubleNewLineIndex + 2);

                        if (eventString.startsWith('data: ')) {
                            const jsonStr = eventString.substring('data: '.length);
                            try {
                                const parsed = JSON.parse(jsonStr);
                                callable(parsed);
                            } catch (err) {
                                console.error('Error parsing JSON:', err, jsonStr);
                                callable({
                                    status: 500,
                                    message: err.message
                                });
                                return;
                            }
                        }
                    }
                }
            } catch (streamError) {
                // Check if it's an abort error
                if (streamError.name === 'AbortError') {
                    console.warn('Stream was cancelled by user');
                    callable('CANCELLED');
                    this.currentStreamController = null;
                    return;
                }

                console.error('Stream processing error:', streamError);
                callable({
                    status: 500,
                    message: streamError.message
                });
                return;
            }
        } catch (error) {
            // Check if it's an abort error
            if (error.name === 'AbortError') {
                console.warn('Stream was cancelled by user');
                callable('CANCELLED');
                this.currentStreamController = null;
                return;
            }

            console.error('ApiCall - Error in stream:', error);
            callable({
                status: 500,
                message: error.message
            });
            return;
        }
    }
}

window.ApiCall = ApiCall;