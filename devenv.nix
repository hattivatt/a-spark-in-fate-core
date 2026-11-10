{ pkgs, ... }:

{
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
  };

  packages = with pkgs; [
    git
    jq
    zip
    rsync
    ripgrep
    fd
    watchexec
  ];
}
