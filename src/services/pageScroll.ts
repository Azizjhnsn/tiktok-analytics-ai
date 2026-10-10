/** Content-script side: scrolls the page and its scrollable containers to the bottom so lazy lists load more. */
export function scrollToBottom(): void {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  for (const element of document.querySelectorAll<HTMLElement>('*')) {
    const { overflowY } = getComputedStyle(element);
    const scrollable = (overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight;
    if (scrollable) element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }
}
