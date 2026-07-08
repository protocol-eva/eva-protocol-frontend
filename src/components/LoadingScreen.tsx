export function LoadingScreen({ fadingOut }: { fadingOut: boolean }) {
  return (
    <div
      className="eva-loader"
      data-fading={fadingOut ? 'true' : 'false'}
      aria-hidden
    >
      <div className="eva-loader__dots">
        <span className="eva-loader__dot" />
        <span className="eva-loader__dot" />
        <span className="eva-loader__dot" />
      </div>
    </div>
  )
}

export default LoadingScreen
