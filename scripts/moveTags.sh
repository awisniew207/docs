#!/bin/zsh

A_COMMIT="b9cb37dd35493589471b4d313e86b22e98b5a2d7"
B_COMMIT="98461bb7c599887c77a8f8442c4efcd6b403793d"

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
