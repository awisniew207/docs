interface LoadingProps {
  copy: string;
  error?: Error;
}

export default function Loading({ copy, error }: LoadingProps) {
  return (
    <div className="container">
      <div className="wrapper">
        <div className="loader-container">
          {/* Use inline-styled spinner that works in production */}
          <div 
            style={{
              display: 'inline-block',
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              border: '4px solid rgba(0, 0, 0, 0.1)',
              borderTopColor: '#767676',
              animation: 'spin 1s linear infinite'
            }}
          ></div>
          <p>{copy}</p>
          
          {/* Global keyframes insertion */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @-webkit-keyframes spin {
              0% { -webkit-transform: rotate(0deg); }
              100% { -webkit-transform: rotate(360deg); }
            }
          `}} />
        </div>
      </div>
    </div>
  );
}
