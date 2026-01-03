import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

function ChatInterface({ messages = [], onSendMessage, isLoading = false }) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((message, index) => (
                    <motion.div
                        key={index}
                        className={`chat-message ${message.role}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div
                        className="chat-message assistant"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                            <span>Thinking...</span>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask me anything about your resume..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="btn btn-primary btn-icon"
                    disabled={!input.trim() || isLoading}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

export default ChatInterface;
