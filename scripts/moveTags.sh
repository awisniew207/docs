#!/bin/zsh

A_COMMIT="fe14b7f00f379d6f77834bde648c0222aaf226d5"
B_COMMIT="da37196b1ab18253c1ae7139242c6022980339bc"

echo "Tags pointing to $A_COMMIT:"

git for-each-ref --format='%(refname:strip=2) %(objecttype) %(objectname)' refs/tags | \
while read -r tag type sha; do
  if [ "$type" = "tag" ]; then
    # Annotated tag: resolve to the commit it points to
    commit=$(git rev-parse "$tag^{commit}")
  else
    # Lightweight tag: direct commit
    commit=$sha
  fi

  if [ "$commit" = "$A_COMMIT" ]; then
    echo "$tag"
    echo "Re-tagging $tag to $B_COMMIT"
    git tag -f "$tag" "$B_COMMIT"
  fi
done

echo "Done. Push with:"
echo "  git push origin --tags --force"
