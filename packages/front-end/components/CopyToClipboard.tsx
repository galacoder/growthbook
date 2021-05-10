import { FC, useState, useRef, useEffect } from "react";

const CopyToClipboard: FC<{ text: string; label?: string }> = ({
  text,
  label,
}) => {
  const [supported, setSupported] = useState(false);
  const [success, setSuccess] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (document.queryCommandSupported("copy")) {
      setSupported(true);
    }
  }, []);

  // Hide success after a short delay
  useEffect(() => {
    if (success) {
      const hide = () => {
        setSuccess(false);
      };
      const timer = window.setTimeout(hide, 1200);
      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [success]);

  return (
    <div className="input-group">
      <span className="mr-2" style={{ alignSelf: "center" }}>
        {label}
      </span>
      <input
        className="form-control"
        type="text"
        value={text}
        ref={ref}
        style={{ maxWidth: 200 }}
        readOnly
        onChange={(e) => {
          e.preventDefault();
          // Do nothing
        }}
      />
      <div className="input-group-append">
        {supported && (
          <>
            {success && (
              <div
                className="tooltip bs-tooltip-bottom show"
                role="tooltip"
                style={{ top: "100%" }}
              >
                <div
                  className="arrow"
                  style={{ left: "50%", marginLeft: "-0.4rem" }}
                ></div>
                <div className="tooltip-inner">Copied!</div>
              </div>
            )}
            <button
              className="btn btn-secondary"
              onClick={(e) => {
                ref.current.select();
                document.execCommand("copy");
                (e.target as HTMLButtonElement).focus();
                setSuccess(true);
              }}
            >
              Copy to Clipboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};
export default CopyToClipboard;