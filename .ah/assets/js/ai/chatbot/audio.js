class ChatbotAudioRecorder extends BaseClass {
    static MIME_TYPES = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus'
    ];

    static AUDIO_CONSTRAINTS = {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
    };

    static RECORDER_OPTIONS = {
        audioBitsPerSecond: 128000
    };

    constructor(chatbotFileInput) {
        super();

        this.chatbotFileInput = chatbotFileInput;
        this.agent            = null;
        this.voiceEnable      = false;
        this.autoVoiceEnable  = false;

        this.initializeElements();
        this.initializeState();

        if (!this.isBrowserCompatible()) {
            this.$recordButton.hide();
            console.warn('Audio recording is not supported in this browser');
            return;
        }

        this.initEvents();
        this.subscribe('loadAgent',     (agent) => this.loadAgent(agent));
        this.subscribe('aiEndTalking', () => this.aiEndTalking());
    }

    initializeElements() {
        this.$recordButton     = $('#record_button');
        this.$recordMainButton = $('#record_button_main');
        this.$recordStatus     = $('#record-status');
        this.$popup            = $('#record_stop_pop');
    }

    initializeState() {
        this.mediaRecorder       = null;
        this.chunks              = [];
        this.recordingInProgress = false;
        this.stream              = null;
    }

    isBrowserCompatible() {
        return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    }

    loadAgent(agent) {
        this.agent           = agent;
        this.voiceEnable     = AgentTool.getConfigurationValue(agent, 'voiceEnable', false);
        this.autoVoiceEnable = AgentTool.getConfigurationValue(agent, 'autoVoiceEnable', false);

        this.$recordButton.toggle(this.voiceEnable);
    }

    initEvents() {
        this.$recordButton.on('click', (e) => {
            e.preventDefault();
            Popup.open('record_stop_pop');

            if (this.autoVoiceEnable) {
                this.startRecording();
            }
        });

        this.$recordMainButton.on('click', async (e) => {
            e.preventDefault();
            this.recordingInProgress ? this.stopRecording() : await this.startRecording();
        });

        $('body').on('click', '.ai-audio-tts', (e) => {
            e.preventDefault();
            this.callTTS($(e.currentTarget));
        });
    }

    aiEndTalking() {
        // Auto tts ?
        if (this.autoVoiceEnable) {
            // Find the last TTS button that is currently playing
            const $playingButton = $('.ai-audio-tts.to-load').last();

            // If we found a playing button, simulate a click to stop it
            if ($playingButton.length > 0) {
                $playingButton.trigger('click');
            }
        }
    }

    async callTTS($button) {
        if ($button.hasClass('loading')) {
            return;
        }

        if ($button.hasClass('to-load')) {
            // We need to download the mp3 binary
            const message = $button.parent().attr('data-raw-msg');

            $button.addClass('loading');

            try {
                const response = await ApiCall.call('POST', `/api/v1/agent/tts`, {
                    message: message,
                });

                if (response.status !== 200) {
                    throw new Error('Failed to load audio');
                }

                // Store the base64 audio and create Audio object
                const audio64 = response.call.responseText;
                $button.data('audio-base64', audio64);
                const audio = this.createAudioFromBase64(audio64);
                $button.data('audio-object', audio);

                // Add ended event listener
                audio.addEventListener('ended', () => {
                    $button.removeClass('playing').addClass('ready');
                });

                $button.removeClass('to-load loading').addClass('ready');
            } catch (error) {
                console.error('TTS error:', error);
                $button.removeClass('loading');
                return;
            }
        } else if ($button.hasClass('ready')) {
            // Play sound
            const audio = $button.data('audio-object');
            audio.play();
            $button.removeClass('ready').addClass('playing');
        } else if ($button.hasClass('playing')) {
            // Stop sound
            const audio = $button.data('audio-object');
            audio.pause();
            audio.currentTime = 0;
            $button.removeClass('playing').addClass('ready');
        }
    }

    // Helper method to create Audio object from base64
    createAudioFromBase64(base64String, type = 'audio/mpeg') {
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: type });
        const audioUrl = URL.createObjectURL(blob);
        return new Audio(audioUrl);
    }

    getSupportedMimeType() {
        return ChatbotAudioRecorder.MIME_TYPES.find(mimeType =>
            MediaRecorder.isTypeSupported(mimeType)
        );
    }

    updateUIState(isRecording) {
        this.$recordMainButton.toggleClass('recording', isRecording);
        this.$recordStatus.text(
            translations[isRecording ? 'messages.chatbot.record.stop' : 'messages.chatbot.record.start']
        );
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: ChatbotAudioRecorder.AUDIO_CONSTRAINTS
            });

            const supportedMimeType = this.getSupportedMimeType();
            if (!supportedMimeType) {
                throw new Error('No supported MIME types found for audio recording');
            }

            this.mediaRecorder = new MediaRecorder(
                this.stream,
                { ...ChatbotAudioRecorder.RECORDER_OPTIONS, mimeType: supportedMimeType }
            );

            this.setupRecordingHandlers(supportedMimeType);
            this.recordingInProgress = true;
            this.updateUIState(true);
            this.mediaRecorder.start();

        } catch (error) {
            this.handleRecordingError(error);
        }
    }

    setupRecordingHandlers(mimeType) {
        this.chunks = [];
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.chunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.chunks, { type: mimeType });
            this.addAudioAsFile(audioBlob);
            this.cleanup();
            Popup.close();
        };
    }

    stopRecording() {
        if (this.mediaRecorder && this.recordingInProgress) {
            this.mediaRecorder.stop();
        }
    }

    // Add audio as uploaded file attachment
    addAudioAsFile(audioBlob) {
        const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
        const fileName = `recording-${timestamp}.webm`;

        const audioFile = new File([audioBlob], fileName, {
            type: audioBlob.type,
            lastModified: Date.now()
        });

        this.chatbotFileInput.handleFiles([audioFile]);

        // If - Auto submit
        if ( this.autoVoiceEnable ) {
            this.trigger('submitUserMessage');
        }
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.initializeState();
        this.updateUIState(false);
    }

    handleRecordingError(error) {
        console.error('Error during recording:', error);
        this.displayError(`Recording error: ${error.message}`);
        this.cleanup();
    }

    displayError(msg) {
        console.error(msg);
        alert(msg); // Consider replacing with a better UI error display
    }
}

// Instantiate it
const chatbotAudioRecorder = new ChatbotAudioRecorder(chatbotFileInput);
window.chatbotAudioRecorder = chatbotAudioRecorder;