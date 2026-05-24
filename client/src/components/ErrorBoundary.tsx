import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SuperSwap error boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#020b1c] px-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#1a2535] bg-[#030e1c]">
            <span className="text-4xl">⚡</span>
          </div>
          <h1 className="mb-2 font-['Inter',sans-serif] text-2xl font-bold text-[#d0d2d6]">
            Something went wrong
          </h1>
          <p className="mb-6 max-w-sm font-['Inter',sans-serif] text-sm leading-relaxed text-[#4d5a6e]">
            {this.state.error?.message ?? "An unexpected error occurred. Please reload the page."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-[14px] border border-[#37c056] bg-[#49f764] px-6 py-3 font-['Inter',sans-serif] text-[15px] font-bold text-[#061a0e] transition-all hover:bg-[#3de055]"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
