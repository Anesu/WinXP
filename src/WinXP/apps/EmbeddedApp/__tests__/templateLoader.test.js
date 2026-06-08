describe('templateLoader seam', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="app-templates" hidden></div>';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('rewrites vendor image paths and injects templates once', async () => {
    const { loadTemplateBundle, isTemplateLoaded } = await import(
      '../templateLoader'
    );
    global.fetch.mockResolvedValue({
      ok: true,
      text: async () =>
        '<template id="tpl-todo"><img src="vendor/98/images/icons/x.png"></template>',
    });

    const host = document.getElementById('app-templates');
    const insertSpy = jest.spyOn(host, 'insertAdjacentHTML');

    await loadTemplateBundle('/apps/templates/todo.html');
    expect(isTemplateLoaded('tpl-todo')).toBe(true);
    expect(insertSpy.mock.calls[0][1]).toContain(
      'src="/apps/vendor/98/images/icons/x.png"',
    );

    await loadTemplateBundle('/apps/templates/todo.html');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws when template bundle fetch fails', async () => {
    const { loadTemplateBundle } = await import('../templateLoader');
    global.fetch.mockResolvedValue({ ok: false });
    await expect(
      loadTemplateBundle('/apps/templates/missing.html'),
    ).rejects.toThrow('Failed to load templates');
  });
});