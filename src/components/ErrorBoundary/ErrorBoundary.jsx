import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, message: "" };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, message: error.message };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: "20px",
                    background: "rgba(232,80,80,0.08)",
                    border: "1px solid rgba(232,80,80,0.3)",
                    borderRadius: "10px",
                    color: "#E85050",
                    fontSize: "0.82rem",
                    margin: "12px 0",
                }}>
                    <strong>Something went wrong:</strong> {this.state.message}
                    <br />
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={{ marginTop: "8px", padding: "4px 10px", cursor: "pointer", fontSize: "0.75rem" }}
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
