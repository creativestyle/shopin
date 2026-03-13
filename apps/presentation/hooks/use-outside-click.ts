import { useEffect, RefObject } from 'react'

/**
 * Custom hook to handle clicks outside of a referenced element
 *
 * Useful for closing dropdowns, modals, or other overlay components
 * when the user clicks outside of them.
 *
 * @param ref - Ref to the element to detect outside clicks for
 * @param handler - Function to call when an outside click is detected
 * @param enabled - Whether the outside click detection is enabled (default: true)
 *
 * @example
 * ```tsx
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false)
 *   const dropdownRef = useRef<HTMLDivElement>(null)
 *
 *   useOutsideClick(dropdownRef, () => setIsOpen(false))
 *
 *   return (
 *     <div ref={dropdownRef}>
 *       {isOpen && <div>Dropdown content</div>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useOutsideClick<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, handler, enabled])
}
