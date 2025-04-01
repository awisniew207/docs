interface LoadingProps {
  copy: string;
  error?: Error;
}

export default function Loading({ copy, error }: LoadingProps) {
  return (
    <div className="container">
      <div className="wrapper">
        <div className="loader-container">
          <div className="loader" style={{ animation: 'spinner 1s ease infinite' }}></div>
          <p>{copy}</p>
        </div>
      </div>
    </div>
  );
}
