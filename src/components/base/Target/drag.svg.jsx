function SvgDrag (props) {
  return (
    <svg
      className="drag_svg__icon"
      viewBox="0 0 1024 1024"
      width="1em"
      height="1em"
      {...props}
    >
      <defs>
        <style />
      </defs>
      <path d="M0 0h1024v1024H0z" fill="#FFF" />
      <path d="M640 853.333A85.333 85.333 0 11725.333 768 85.333 85.333 0 01640 853.333zm-256 0A85.333 85.333 0 11469.333 768 85.333 85.333 0 01384 853.333zm256-256A85.333 85.333 0 11725.333 512 85.333 85.333 0 01640 597.333zm-256 0A85.333 85.333 0 11469.333 512 85.333 85.333 0 01384 597.333zm256-256A85.333 85.333 0 11725.333 256 85.333 85.333 0 01640 341.333zm-256 0A85.333 85.333 0 11469.333 256 85.333 85.333 0 01384 341.333z" />
    </svg>
  )
}

export default SvgDrag